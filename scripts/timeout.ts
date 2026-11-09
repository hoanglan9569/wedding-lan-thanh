/**
 * Playwright timeout constants for wedding-lan-thanh scripts.
 * - contexts run every action, wait and navigation on DEFAULT;
 * - a shorter member for an element that may not come;
 * - LONG and above only when nothing concrete can be awaited, with
 *   `// last-resort: <why>` on that line or the line above;
 * - never a raw number.
 */
export const Timeout = {
  IMMEDIATE: 0,
  EXTREME_SHORT: 50,
  VERY_SHORT: 1_000,
  SHORT: 5_000,
  DEFAULT: 15_000,
  LONG: 60_000,
  VERY_LONG: 120_000,
  MAX: 240_000,
} as const;

export type Timeout = (typeof Timeout)[keyof typeof Timeout];
