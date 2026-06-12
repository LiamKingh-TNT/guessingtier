export interface TierLevel {
  value: number;
  label: string;
}

export const TIER_LEVELS: TierLevel[] = [
  { value: 0, label: "S" },
  { value: 1, label: "A" },
  { value: 2, label: "B" },
  { value: 3, label: "C" },
  { value: 4, label: "D" },
];

export const TIER_COLORS: string[] = [
  "#FF8C8C",
  "#FFB366",
  "#FFE066",
  "#FFF066",
  "#A6E58A",
];

export function calculateTierPoints(
  correctTier: number,
  guessedTier: number,
): number {
  const diff = Math.abs(correctTier - guessedTier);
  if (diff === 0) return 2;
  if (diff === 1) return 1;
  return 0;
}
