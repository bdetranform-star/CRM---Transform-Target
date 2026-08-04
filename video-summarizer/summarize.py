#!/usr/bin/env python3
"""
summarize.py — condense long fixed-camera activity footage (e.g. a 9-hour
worker-activity recording) into a short highlight video plus a text/JSON
activity report.

Pipeline:
  1. DETECT   — stream through the source video with OpenCV, sampling every
                Nth frame, and use background subtraction to flag each
                sampled frame as "active" (motion) or "idle" (static).
  2. SEGMENT  — collapse the per-frame flags into contiguous time ranges,
                then smooth out noise (very short blips/gaps get absorbed
                into their neighbors) to get a clean Active/Idle timeline.
  3. PLAN     — decide, per segment, whether it's kept in the output and at
                what playback speed, dynamically adjusting active/idle
                speed factors so the assembled video lands close to
                --target-duration.
  4. RENDER   — hand the plan to ffmpeg (via ffmpeg-python) as a single
                trim + setpts + concat filter graph — no intermediate files.
  5. REPORT   — write a JSON report (and print a text summary) with total
                durations and the Active/Idle timestamp timeline.

Usage:
    python summarize.py --input recording.mp4 --output summary_output.mp4 \\
        --target-duration 120

Requires the `ffmpeg`/`ffprobe` binaries on PATH in addition to the Python
packages in requirements.txt — ffmpeg-python is a thin wrapper around the
CLI tool, it does not bundle ffmpeg itself.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import cv2
import ffmpeg
import numpy as np

logger = logging.getLogger("summarize")


# --------------------------------------------------------------------------
# Data model
# --------------------------------------------------------------------------


@dataclass
class VideoMeta:
    path: str
    fps: float
    frame_count: int  # container-reported estimate; can be inaccurate
    width: int
    height: int
    duration: float  # seconds, derived from frame_count/fps (best-effort)


@dataclass
class Segment:
    """A contiguous time range of the source video with a single Active/Idle label."""

    start: float  # seconds
    end: float  # seconds
    active: bool

    @property
    def duration(self) -> float:
        return max(0.0, self.end - self.start)


@dataclass
class CompilationPlan:
    active_speed: float
    idle_speed: float
    idle_dropped_keys: set  # {(start, end)} of idle segments dropped entirely
    estimated_duration: float
    target_duration: float
    warnings: List[str] = field(default_factory=list)

    def is_included(self, seg: Segment) -> bool:
        if seg.active:
            return True
        return (seg.start, seg.end) not in self.idle_dropped_keys


# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------


def format_ts(seconds: float) -> str:
    """Seconds -> "HH:MM:SS", clamped to non-negative."""
    seconds = max(0, int(round(seconds)))
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def check_ffmpeg_available() -> None:
    """Fail fast with a clear message rather than a deep ffmpeg-python traceback."""
    from shutil import which

    missing = [name for name in ("ffmpeg", "ffprobe") if which(name) is None]
    if missing:
        raise SystemExit(
            f"Missing required system binaries: {', '.join(missing)}. "
            "Install ffmpeg (e.g. `apt install ffmpeg` / `brew install ffmpeg`) "
            "and make sure it's on PATH — ffmpeg-python only wraps the CLI tool, "
            "it doesn't bundle it."
        )


# --------------------------------------------------------------------------
# Step 1-2: activity detection + segmentation
# --------------------------------------------------------------------------


def open_video(path: str) -> Tuple[cv2.VideoCapture, VideoMeta]:
    if not os.path.isfile(path):
        raise SystemExit(f"Input video not found: {path}")

    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise SystemExit(f"Could not open video (unsupported codec/container?): {path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 0 or fps > 240:
        logger.warning("Container reported an unusable FPS (%s); assuming 25.0 fps.", fps)
        fps = 25.0

    # CAP_PROP_FRAME_COUNT is a container-level estimate and can be wrong
    # (variable frame rate, some MP4 muxers, etc.) — only used for the
    # progress percentage and the duration fallback, never for correctness.
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    duration = frame_count / fps if frame_count > 0 else 0.0

    meta = VideoMeta(path=path, fps=fps, frame_count=frame_count, width=width, height=height, duration=duration)
    return cap, meta


def detect_activity_samples(
    cap: cv2.VideoCapture,
    meta: VideoMeta,
    sample_fps: float,
    motion_threshold: float,
    analysis_width: int,
    warmup_seconds: float,
    progress_interval: float,
) -> List[Tuple[float, bool]]:
    """
    Streams through the whole video ONE frame at a time (never holding more
    than the current frame in memory) and returns a list of
    (timestamp_seconds, is_active) samples, one per sampled frame.

    Frames between samples are `grab()`-ed (cheap — advances the decoder
    without fully decoding/allocating a frame) rather than `read()`, so we
    pay full decode cost only for the frames we actually analyze. This is
    what keeps a 9-hour source tractable: memory stays flat, and CPU work
    scales with --sample-fps, not with the source frame rate.
    """
    sample_interval = max(1, round(meta.fps / sample_fps))
    analysis_height = max(1, round(analysis_width * meta.height / meta.width)) if meta.width else analysis_width

    # detectShadows=False: shadows cast by people moving under fixed lighting
    # would otherwise register as "motion" on the floor/desk, inflating the
    # active-time estimate.
    bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=200, varThreshold=16, detectShadows=False)
    warmup_samples = max(1, round(warmup_seconds * sample_fps))

    samples: List[Tuple[float, bool]] = []
    frame_idx = 0
    next_sample_idx = 0
    sample_count = 0

    start_wall = time.monotonic()
    last_log_wall = start_wall

    logger.info(
        "Detecting activity: sampling ~%.1f fps (every %d source frames), analysis frame %dx%d",
        sample_fps,
        sample_interval,
        analysis_width,
        analysis_height,
    )

    while True:
        if not cap.grab():
            break  # end of stream

        if frame_idx == next_sample_idx:
            ok, frame = cap.retrieve()
            if ok:
                small = cv2.resize(frame, (analysis_width, analysis_height), interpolation=cv2.INTER_AREA)
                fg_mask = bg_subtractor.apply(small)
                motion_ratio = cv2.countNonZero(fg_mask) / fg_mask.size

                is_active = motion_ratio >= motion_threshold and sample_count >= warmup_samples
                timestamp = frame_idx / meta.fps
                samples.append((timestamp, is_active))
                sample_count += 1

            next_sample_idx += sample_interval

        frame_idx += 1

        now = time.monotonic()
        if now - last_log_wall >= progress_interval:
            last_log_wall = now
            elapsed = now - start_wall
            video_time = frame_idx / meta.fps
            if meta.frame_count > 0:
                pct = min(100.0, 100.0 * frame_idx / meta.frame_count)
                logger.info(
                    "  ... %s / %s (%.1f%%) source video processed, %.0fs elapsed",
                    format_ts(video_time),
                    format_ts(meta.duration),
                    pct,
                    elapsed,
                )
            else:
                logger.info("  ... %s of source video processed, %.0fs elapsed", format_ts(video_time), elapsed)

    if meta.frame_count == 0:
        # Container didn't report a usable frame count up front — now that
        # we've streamed the whole thing we know the real duration.
        meta.frame_count = frame_idx
        meta.duration = frame_idx / meta.fps

    logger.info(
        "Detection pass complete: %d samples analyzed over %s of source video (%.0fs elapsed)",
        len(samples),
        format_ts(meta.duration),
        time.monotonic() - start_wall,
    )
    return samples


def samples_to_segments(samples: List[Tuple[float, bool]], sample_interval_s: float) -> List[Segment]:
    """Collapses a stream of per-sample (timestamp, is_active) flags into contiguous Segments."""
    if not samples:
        return []

    segments: List[Segment] = []
    seg_start, seg_active = samples[0]
    prev_ts = seg_start

    for ts, active in samples[1:]:
        if active != seg_active:
            segments.append(Segment(seg_start, prev_ts + sample_interval_s, seg_active))
            seg_start, seg_active = ts, active
        prev_ts = ts

    segments.append(Segment(seg_start, prev_ts + sample_interval_s, seg_active))
    return segments


def merge_short_segments(
    segments: List[Segment],
    min_idle_gap: float,
    min_active_burst: float,
    max_passes: int = 4,
) -> List[Segment]:
    """
    Smooths the raw segment list so brief detector noise doesn't fragment
    the timeline: an idle gap shorter than `min_idle_gap` is folded into
    activity (a person pausing mid-task isn't "idle"), and an active burst
    shorter than `min_active_burst` is folded into idle (a single noisy
    frame isn't "activity"). Runs a few passes since coalescing can make a
    previously-fine neighbor short enough to need relabeling too.
    """
    current = segments
    for _ in range(max_passes):
        relabeled = []
        for seg in current:
            active = seg.active
            if active and seg.duration < min_active_burst:
                active = False
            elif not active and seg.duration < min_idle_gap:
                active = True
            relabeled.append(Segment(seg.start, seg.end, active))

        coalesced: List[Segment] = []
        for seg in relabeled:
            if coalesced and coalesced[-1].active == seg.active:
                coalesced[-1] = Segment(coalesced[-1].start, seg.end, seg.active)
            else:
                coalesced.append(seg)

        if coalesced == current:
            break
        current = coalesced

    return current


# --------------------------------------------------------------------------
# Step 3: compilation planning (dynamic speed factors)
# --------------------------------------------------------------------------

# Floor for idle playback speed when we have *surplus* time budget (i.e. the
# source is short enough that even minimum-speed active playback undershoots
# the target) — never slower than this, so idle time never stops looking
# "sped up". Not exposed as a flag: it only matters in the rare case of a
# short/mostly-idle source, and the active-speed bounds are the knobs that
# actually matter for the common (very long source) case.
_IDLE_SPEED_FLOOR = 20.0
_IDLE_SPEED_HARD_CAP = 240.0


def plan_compilation(
    segments: List[Segment],
    target_duration: float,
    idle_skip_threshold: float,
    active_speed_min: float,
    active_speed_max: float,
    idle_speed_default: float,
) -> CompilationPlan:
    """
    Decides the active/idle playback speeds (and which idle segments to drop
    outright) to land the assembled output close to `target_duration`.

    The levers are tried in the order that costs the viewer the least first:
      1. Idle segments >= idle_skip_threshold are ALWAYS dropped — no speed
         makes several idle hours worth watching.
      2. If that's not enough to hit the target, raise active_speed up to
         active_speed_max (still watchable, just brisker).
      3. If that's still not enough, raise idle_speed past its default.
      4. If that's still not enough, start dropping the longest *kept* idle
         segments too, one at a time, until it fits.
      5. If even that doesn't fit (all idle dropped, active at max speed),
         accept the overage and say so explicitly rather than silently
         producing a longer-than-requested video.
    Symmetrically, if the source is short enough that minimum-speed active
    playback alone undershoots the target, idle segments are slowed down
    (down to a floor) to use the spare time rather than rushing needlessly.
    """
    active_segs = [s for s in segments if s.active]
    idle_segs = [s for s in segments if not s.active]

    idle_kept = [s for s in idle_segs if s.duration < idle_skip_threshold]
    idle_dropped = [s for s in idle_segs if s.duration >= idle_skip_threshold]

    active_total = sum(s.duration for s in active_segs)
    idle_kept_total = sum(s.duration for s in idle_kept)

    warnings: List[str] = []

    def estimate(a_speed: float, i_speed: float, idle_time: float) -> float:
        a_part = active_total / a_speed if a_speed > 0 else 0.0
        i_part = idle_time / i_speed if i_speed > 0 else 0.0
        return a_part + i_part

    if active_total == 0:
        warnings.append("No activity was detected anywhere in the source video.")
        active_speed = active_speed_max
        idle_speed = idle_speed_default
        estimated = estimate(active_speed, idle_speed, idle_kept_total)
    else:
        active_speed = (active_speed_min + active_speed_max) / 2
        idle_speed = idle_speed_default
        idle_time_budget = idle_kept_total
        estimated = estimate(active_speed, idle_speed, idle_time_budget)

        if estimated > target_duration:
            # 2) push active speed to its cap
            active_speed = active_speed_max
            estimated = estimate(active_speed, idle_speed, idle_time_budget)

            # 3) push idle speed past its default
            if estimated > target_duration and idle_time_budget > 0:
                remaining = target_duration - active_total / active_speed
                if remaining > 0:
                    idle_speed = min(_IDLE_SPEED_HARD_CAP, max(idle_speed_default, idle_time_budget / remaining))
                else:
                    idle_speed = _IDLE_SPEED_HARD_CAP
                estimated = estimate(active_speed, idle_speed, idle_time_budget)

            # 4) drop the longest kept-idle segments until it fits
            if estimated > target_duration and idle_kept:
                idle_kept = sorted(idle_kept, key=lambda s: s.duration, reverse=True)
                while idle_kept and estimate(active_speed, idle_speed, idle_time_budget) > target_duration:
                    worst = idle_kept.pop(0)
                    idle_dropped.append(worst)
                    idle_time_budget -= worst.duration
                idle_kept = sorted(idle_kept, key=lambda s: s.start)
                estimated = estimate(active_speed, idle_speed, idle_time_budget)

            # 5) still doesn't fit — say so
            if estimated > target_duration:
                warnings.append(
                    f"Could not reach the {target_duration:.0f}s target even at "
                    f"{active_speed:.1f}x active speed with all idle time dropped; "
                    f"output will be about {estimated:.0f}s. Raise --target-duration "
                    "or --active-speed-max to compensate."
                )
        else:
            # Surplus budget: prefer slower (more watchable) active playback
            # before touching idle speed at all.
            active_speed = active_speed_min
            estimated = estimate(active_speed, idle_speed, idle_time_budget)

            if estimated < target_duration and idle_time_budget > 0:
                remaining = target_duration - active_total / active_speed
                if remaining > 0:
                    desired_idle_speed = idle_time_budget / remaining
                    idle_speed = max(_IDLE_SPEED_FLOOR, min(idle_speed_default, desired_idle_speed))
                    estimated = estimate(active_speed, idle_speed, idle_time_budget)
            # If we're still under target here, that's fine — "close to"
            # the target, not an exact quota to fill artificially.

    return CompilationPlan(
        active_speed=round(active_speed, 3),
        idle_speed=round(idle_speed, 3),
        idle_dropped_keys={(s.start, s.end) for s in idle_dropped},
        estimated_duration=estimated,
        target_duration=target_duration,
        warnings=warnings,
    )


# --------------------------------------------------------------------------
# Step 4: render via ffmpeg
# --------------------------------------------------------------------------


def render_output_video(
    input_path: str,
    output_path: str,
    segments: List[Segment],
    plan: CompilationPlan,
    scale_width: Optional[int],
    preset: str,
    crf: int,
) -> None:
    """
    Builds ONE ffmpeg filter graph — per kept segment: seek+trim the source
    (`-ss`/`-t`, fast keyframe-based input seeking, no full re-decode of
    skipped material) then `setpts` to change its playback speed — and
    concatenates them in chronological order. No intermediate files, no
    audio (surveillance-style fixed-camera footage rarely has usable audio,
    and speeding audio 4x-100x needs pitch-preserving `atempo` chaining,
    which is out of scope for this MVP).
    """
    ordered = [(seg, plan.active_speed if seg.active else plan.idle_speed) for seg in segments if plan.is_included(seg)]

    if not ordered:
        raise SystemExit("Nothing was selected for the output video (no segments survived planning).")

    logger.info(
        "Rendering %d segments (%d active, %d idle) at %.2fx / %.2fx speed...",
        len(ordered),
        sum(1 for s, _ in ordered if s.active),
        sum(1 for s, _ in ordered if not s.active),
        plan.active_speed,
        plan.idle_speed,
    )

    streams = []
    for seg, speed in ordered:
        node = ffmpeg.input(input_path, ss=seg.start, t=seg.duration)
        node = node.filter("setpts", f"PTS/{speed}")
        if scale_width:
            node = node.filter("scale", scale_width, -2)
        streams.append(node)

    joined = ffmpeg.concat(*streams, v=1, a=0)
    out = ffmpeg.output(
        joined,
        output_path,
        vcodec="libx264",
        preset=preset,
        crf=crf,
        pix_fmt="yuv420p",
    ).overwrite_output()

    try:
        out.run(quiet=True, capture_stdout=True, capture_stderr=True)
    except ffmpeg.Error as exc:
        stderr = exc.stderr.decode(errors="replace") if exc.stderr else "(no stderr captured)"
        raise SystemExit(f"ffmpeg failed while rendering the output video:\n{stderr[-4000:]}") from exc

    logger.info("Wrote %s", output_path)


# --------------------------------------------------------------------------
# Step 5: report
# --------------------------------------------------------------------------


def build_report(
    meta: VideoMeta,
    segments: List[Segment],
    plan: CompilationPlan,
    output_path: str,
    processing_seconds: float,
) -> dict:
    active_total = sum(s.duration for s in segments if s.active)
    idle_total = sum(s.duration for s in segments if not s.active)

    timeline = [
        {
            "start": format_ts(seg.start),
            "end": format_ts(seg.end),
            "start_seconds": round(seg.start, 2),
            "end_seconds": round(seg.end, 2),
            "duration_seconds": round(seg.duration, 2),
            "label": "Active" if seg.active else "Idle",
            "included_in_output": plan.is_included(seg),
        }
        for seg in segments
    ]

    return {
        "input_video": meta.path,
        "output_video": output_path,
        "source_duration": format_ts(meta.duration),
        "source_duration_seconds": round(meta.duration, 2),
        "total_active_time": format_ts(active_total),
        "total_active_seconds": round(active_total, 2),
        "total_idle_time": format_ts(idle_total),
        "total_idle_seconds": round(idle_total, 2),
        "active_speed_used": plan.active_speed,
        "idle_speed_used": plan.idle_speed,
        "target_duration_seconds": plan.target_duration,
        "estimated_output_duration_seconds": round(plan.estimated_duration, 2),
        "warnings": plan.warnings,
        "processing_time_seconds": round(processing_seconds, 2),
        "timeline": timeline,
    }


def print_report_summary(report: dict) -> None:
    print("\n===== Activity Summary =====")
    print(f"Source video:     {report['input_video']}")
    print(f"Source duration:  {report['source_duration']}")
    print(f"Active time:      {report['total_active_time']}")
    print(f"Idle time:        {report['total_idle_time']}")
    print(f"Output video:     {report['output_video']}")
    print(
        f"Output duration:  ~{format_ts(report['estimated_output_duration_seconds'])} "
        f"(target was {format_ts(report['target_duration_seconds'])})"
    )
    print(f"Speeds used:      {report['active_speed_used']}x active / {report['idle_speed_used']}x idle")
    if report["warnings"]:
        print("Warnings:")
        for w in report["warnings"]:
            print(f"  - {w}")
    print("\nTimeline:")
    for entry in report["timeline"]:
        mark = "" if entry["included_in_output"] else "  [dropped from output]"
        print(f"  {entry['start']}-{entry['end']} - {entry['label']}{mark}")
    print("=============================\n")


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Condense a long fixed-camera recording into a short highlight video + activity report.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument("--input", required=True, help="Path to the source video file.")
    p.add_argument("--output", default="summary_output.mp4", help="Path to write the highlight video to.")
    p.add_argument(
        "--report",
        default=None,
        help="Path to write the JSON report to. Defaults to <output>.json alongside the video.",
    )
    p.add_argument("--target-duration", type=float, default=120.0, help="Desired output video length, in seconds.")

    detect = p.add_argument_group("activity detection")
    detect.add_argument("--sample-fps", type=float, default=2.0, help="How many frames per second to analyze for motion.")
    detect.add_argument(
        "--motion-threshold",
        type=float,
        default=0.015,
        help="Fraction of the (downscaled) frame that must change to count as motion.",
    )
    detect.add_argument("--analysis-width", type=int, default=320, help="Width frames are downscaled to before motion analysis.")
    detect.add_argument("--warmup-seconds", type=float, default=2.0, help="Time given to the background model to stabilize before it can flag activity.")
    detect.add_argument("--min-idle-gap", type=float, default=2.0, help="Idle gaps shorter than this are folded into surrounding activity.")
    detect.add_argument("--min-active-burst", type=float, default=1.0, help="Active bursts shorter than this are folded into surrounding idle.")

    plan = p.add_argument_group("compilation planning")
    plan.add_argument("--idle-skip-threshold", type=float, default=30.0, help="Idle segments at least this long are dropped from the output entirely.")
    plan.add_argument("--active-speed-min", type=float, default=4.0, help="Slowest allowed playback speed for active segments.")
    plan.add_argument("--active-speed-max", type=float, default=8.0, help="Fastest allowed playback speed for active segments.")
    plan.add_argument("--idle-speed", type=float, default=80.0, help="Default playback speed for kept (sub-threshold) idle segments.")

    render = p.add_argument_group("rendering")
    render.add_argument("--scale-width", type=int, default=None, help="Optionally downscale output to this width (height auto, even). Default: keep source resolution.")
    render.add_argument("--preset", default="veryfast", help="ffmpeg libx264 preset (speed/size tradeoff).")
    render.add_argument("--crf", type=int, default=23, help="ffmpeg libx264 CRF (quality; lower = better/larger).")

    p.add_argument("--progress-interval", type=float, default=5.0, help="Seconds between progress log lines during detection.")
    p.add_argument("--quiet", action="store_true", help="Only log warnings/errors.")

    return p.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> None:
    args = parse_args(argv)

    logging.basicConfig(
        level=logging.WARNING if args.quiet else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    check_ffmpeg_available()

    report_path = args.report or (os.path.splitext(args.output)[0] + "_report.json")
    output_dir = os.path.dirname(os.path.abspath(args.output))
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    start_time = time.monotonic()

    cap, meta = open_video(args.input)
    logger.info(
        "Opened %s: %dx%d @ %.2ffps, reported duration %s",
        args.input,
        meta.width,
        meta.height,
        meta.fps,
        format_ts(meta.duration) if meta.duration else "unknown",
    )

    try:
        samples = detect_activity_samples(
            cap,
            meta,
            sample_fps=args.sample_fps,
            motion_threshold=args.motion_threshold,
            analysis_width=args.analysis_width,
            warmup_seconds=args.warmup_seconds,
            progress_interval=args.progress_interval,
        )
    finally:
        cap.release()

    if not samples:
        raise SystemExit("No frames could be read from the input video.")

    sample_interval_s = 1.0 / args.sample_fps
    raw_segments = samples_to_segments(samples, sample_interval_s)
    segments = merge_short_segments(raw_segments, args.min_idle_gap, args.min_active_burst)

    logger.info(
        "Timeline: %d segments after smoothing (%d raw before smoothing)",
        len(segments),
        len(raw_segments),
    )

    compilation_plan = plan_compilation(
        segments,
        target_duration=args.target_duration,
        idle_skip_threshold=args.idle_skip_threshold,
        active_speed_min=args.active_speed_min,
        active_speed_max=args.active_speed_max,
        idle_speed_default=args.idle_speed,
    )
    for w in compilation_plan.warnings:
        logger.warning(w)

    render_output_video(
        args.input,
        args.output,
        segments,
        compilation_plan,
        scale_width=args.scale_width,
        preset=args.preset,
        crf=args.crf,
    )

    processing_seconds = time.monotonic() - start_time
    report = build_report(meta, segments, compilation_plan, args.output, processing_seconds)

    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    logger.info("Wrote report to %s", report_path)

    print_report_summary(report)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("\nInterrupted.")
