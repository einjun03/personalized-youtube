import Anthropic from '@anthropic-ai/sdk';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL_OPUS = 'claude-opus-4-7';
const MODEL_HAIKU = 'claude-haiku-4-5-20251001';

const LOG_PATH = process.cwd() + '/../../logs/anthropic.jsonl';

interface LogEntry {
  ts: string;
  sessionId?: string;
  visitorId?: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  cacheHitRatio: number;
  costUsd: number;
  model: string;
  toolUses: Array<{ name: string; input: unknown }>;
  stopReason?: string | null;
  error?: string;
}

async function appendLog(entry: LogEntry) {
  try {
    await mkdir(dirname(LOG_PATH), { recursive: true });
    await appendFile(LOG_PATH, JSON.stringify(entry) + '\n');
  } catch {
    // logging is best-effort; don't crash the request
  }
}

// Approximate cost per million tokens (Opus 4.7). Haiku is roughly 1/5 input / 1/4 output.
const COST_PER_M = {
  [MODEL_OPUS]: { in: 15, cachedIn: 1.5, cacheWrite: 18.75, out: 75 },
  [MODEL_HAIKU]: { in: 1, cachedIn: 0.1, cacheWrite: 1.25, out: 5 },
} as const;

export function estimateCost(model: string, usage: {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}) {
  const c = COST_PER_M[model as keyof typeof COST_PER_M] ?? COST_PER_M[MODEL_OPUS];
  const inT = usage.input_tokens ?? 0;
  const outT = usage.output_tokens ?? 0;
  const cReadT = usage.cache_read_input_tokens ?? 0;
  const cWriteT = usage.cache_creation_input_tokens ?? 0;
  return (
    (inT * c.in + outT * c.out + cReadT * c.cachedIn + cWriteT * c.cacheWrite) / 1_000_000
  );
}

export { client as anthropic, MODEL_OPUS, MODEL_HAIKU, appendLog };
export type { LogEntry };
