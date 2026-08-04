# Video Activity Summarizer

Condenses a long fixed-camera recording (e.g. a 9-hour worker-activity feed)
into a short highlight video plus a JSON/text activity report. Standalone
CLI tool — not part of the Transform Targets CRM web app.

## Setup

```bash
# System dependency (not pip-installable):
#   Ubuntu/Debian: apt install ffmpeg
#   macOS:         brew install ffmpeg

pip install -r requirements.txt
```

## Usage

```bash
python summarize.py --input recording.mp4 --output summary_output.mp4 --target-duration 120
```

This writes `summary_output.mp4` (the highlight video) and
`summary_output_report.json` (the activity report) alongside it, and prints
a text summary — total durations plus an Active/Idle timeline — to the
console.

Run `python summarize.py --help` for the full list of tunable flags (motion
sensitivity, segment-smoothing thresholds, idle-skip threshold, speed
bounds, output scaling, ffmpeg encode settings). The defaults match the
brief: active segments play at 4x-8x, idle segments at 80x (or are dropped
entirely past 30s), dynamically adjusted to land close to
`--target-duration`.

## How it works

1. **Detect** — streams through the video with OpenCV (`cap.grab()` to skip
   frames cheaply, `cap.retrieve()` only on sampled frames — never more than
   one frame in memory), running background subtraction
   (`cv2.createBackgroundSubtractorMOG2`) on a downscaled copy of each
   sampled frame to flag it Active/Idle.
2. **Segment** — collapses the per-frame flags into contiguous time ranges,
   then smooths out detector noise (very short blips/gaps get absorbed into
   their neighbors).
3. **Plan** — decides which segments are kept and at what speed. Idle
   segments at/above `--idle-skip-threshold` are always dropped outright;
   otherwise active/idle speeds are adjusted (active speed first, since
   that's what determines whether you can actually see what happened, then
   idle speed, then — only as a last resort for an unreachably tight target
   — dropping additional short idle segments) to land close to
   `--target-duration`. If the target can't be hit even at the max allowed
   speeds, the tool says so explicitly rather than silently producing a
   longer video.
4. **Render** — hands the plan to ffmpeg as a single trim + `setpts` (speed
   change) + `concat` filter graph, one ffmpeg process, no intermediate
   files.
5. **Report** — writes the JSON report and prints the timeline to the
   console.

## Known limitations (MVP scope)

- **No audio** in the output. Speeding audio 4x-100x needs pitch-preserving
  `atempo` filter chaining (each `atempo` instance maxes out at 2x); dropping
  audio entirely was the simpler MVP choice, and fixed-camera activity
  footage often has no useful audio track anyway.
- **Input seeking is keyframe-based** (`-ss` before `-i`), which is fast and
  accurate on modern ffmpeg but can drift by a fraction of a second on
  sources with very sparse keyframes — fine for a highlight reel, not for
  frame-precise editing.
- **`CAP_PROP_FRAME_COUNT`** (used only for the progress-bar percentage and
  as a duration fallback) is a container-reported estimate and can be
  slightly off for some containers/variable-frame-rate sources; it never
  affects where the video actually ends, since detection stops when
  `cap.grab()` returns `False`, not when a frame counter runs out.
- Motion detection is a single global "how much of the frame changed"
  signal — it can't distinguish "a worker doing something" from "a shadow
  moving" or "lighting flicker." `--motion-threshold` is the knob to retune
  per camera if you're getting false positives/negatives.
