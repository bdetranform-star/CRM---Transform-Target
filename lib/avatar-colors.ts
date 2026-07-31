import { CATEGORICAL_PALETTE } from "@/lib/chart-palette";

/**
 * Per-swatch text color for CATEGORICAL_PALETTE, computed via the WCAG
 * relative-luminance formula (same convention as the status pills in
 * lib/status-config.ts) so every bg/fg pairing below is >= 4.5:1 — pure
 * black passes on every swatch except violet, which needs white instead.
 */
const AVATAR_TEXT_COLORS: string[] = [
  "#000000", // brand green
  "#000000", // blue
  "#000000", // orange
  "#000000", // aqua
  "#000000", // yellow
  "#000000", // magenta
  "#ffffff", // violet
  "#000000", // red
];

export const AVATAR_COLOR_PALETTE: { bg: string; fg: string }[] = CATEGORICAL_PALETTE.map((bg, i) => ({
  bg,
  fg: AVATAR_TEXT_COLORS[i],
}));

/** djb2 string hash — small, fast, good-enough distribution for a palette index. */
function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Deterministic avatar color for a contact: the same id always maps to the
 * same palette slot, so a contact's initials-avatar color never changes
 * between renders/pages, but different contacts are spread across the
 * palette rather than all sharing one color.
 */
export function avatarColorForId(id: string): { bg: string; fg: string } {
  const index = hashString(id) % AVATAR_COLOR_PALETTE.length;
  return AVATAR_COLOR_PALETTE[index];
}
