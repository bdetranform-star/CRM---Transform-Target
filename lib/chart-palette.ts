// Categorical palette, fixed slot order. Slot 1 is the exact brand green
// sampled from public/logo.png (#5fce81), leading the sequence per the 2026
// rebrand; slots 2-8 are the dataviz skill's own validated reference hues,
// swapped in as-is rather than hand-tuned, since re-deriving a CVD-safe
// ramp from scratch is exactly what the skill's validator exists to avoid.
// Re-validated as a set with scripts/validate_palette.js after the swap —
// all hard gates (lightness band, chroma floor, CVD separation, normal-vision
// floor) pass; the brand green carries the same sub-3:1-vs-white-surface WARN
// the original "aqua" slot already had, which is fine since every chart using
// this palette already ships direct labels/legends (the required relief).
// Passes adjacent-pair CVD/contrast gates; not reordered or re-cycled across charts.
export const CATEGORICAL_PALETTE = [
  "#5fce81", // brand green
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#4a3aa7", // violet
  "#e34948", // red
];

// Single-series accent (daily line charts) — brand green, matching the
// categorical palette's lead slot and the rest of the brand re-theme.
export const SEQUENTIAL_BRAND = "#5fce81";
