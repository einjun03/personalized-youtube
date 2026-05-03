export const RECOMMENDED_PROMPTS = [
  // Aesthetics
  'Use a forest green dark theme',
  'Make text bigger',
  'Square thumbnails, larger size',
  'Compact layout, more videos visible',
  // Recommendations
  'Show me more chill jazz, less high-energy',
  'Only music and cooking videos',
  'Hide videos shorter than 5 minutes',
  'Sort by most recent',
  // Layout
  'Hide the shorts row',
  'Move recommendations to the top',
  'Show creator names bigger than titles',
  // Reset
  'Reset everything to default',
] as const;

export type RecommendedPrompt = (typeof RECOMMENDED_PROMPTS)[number];

export function pickRotatingChips(seed: number, count = 3): RecommendedPrompt[] {
  const out: RecommendedPrompt[] = [];
  const used = new Set<number>();
  let idx = seed % RECOMMENDED_PROMPTS.length;
  while (out.length < count) {
    if (!used.has(idx)) {
      out.push(RECOMMENDED_PROMPTS[idx]!);
      used.add(idx);
    }
    idx = (idx + 7) % RECOMMENDED_PROMPTS.length;
  }
  return out;
}
