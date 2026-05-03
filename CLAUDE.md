# CLAUDE.md — Orchestrator Brief

This file is loaded into every Claude Code session for this repo. It's the **orchestrator's brief** — the high-level map of the project, the conventions, and the agent ownership table. Implementation details live in the per-domain code; nuanced decisions live in `docs/decisions.md`.

## What this project is

A **personalizable YouTube clone showcase**. Visitors land on a hand-built YouTube-shaped homepage, type any prompt to personalize it (*"green dark theme, hide shorts, more chill jazz, less bangers"*), and the page updates live. Preferences stick across reloads via cookie-anonymous identity. v0 uses a 300-video mock catalog with on-demand fill via Claude Haiku for arbitrary niche queries; v0.5 (Week 2) swaps in real YouTube data via a CDP-intercepted `youtubei` adapter in an Electron sidecar.

The full plan: `/Users/ejun22/.claude/plans/yes-absolutely-and-sleepy-dewdrop.md`.

## Stack

- Next.js 15 (App Router) + React 19 + Tailwind 3.4
- Zustand + zundo (in-tab undo)
- Supabase (database + storage; cookie-anonymous, no auth in v0)
- Anthropic SDK (`@anthropic-ai/sdk`) with `claude-opus-4-7` for chat, `claude-haiku-4-5-20251001` for catalog gen
- pnpm workspaces; one app (`apps/web`) + `packages/shared`. The earlier `apps/desktop` Electron sidecar has been removed; real YouTube data now flows through `apps/web/lib/innertube/` reading Chrome cookies directly.

## Repo layout (root = this directory)

```
showcase/
  apps/
    web/                          # Next.js 15
                                  # (apps/desktop was removed — real YouTube data now lives in apps/web/lib/innertube/)
  packages/shared/                # Zod schemas, tool defs, PageConfig types
  .claude/agents/                 # 8 specialist subagents
  supabase/migrations/            # numbered, append-only SQL
  scripts/seed.ts                 # mock catalog generation
  docs/                           # ONBOARDING, architecture, GLOSSARY, decisions, youtube-adapter
  logs/                           # JSONL Anthropic call logs (gitignored)
```

## How to use this repo (the delegation pipeline)

**The main Claude Code session is an orchestrator, not an implementer.** When you (the user, or a future Claude session) ask for a change:

1. Identify the affected domain (schemas, templates, API, DB, mock data, real data, debugging).
2. Delegate to the matching specialist subagent in `.claude/agents/`.
3. Each subagent runs in its own context window and returns a 3-line summary.
4. The main session never accumulates implementation details — only the high-level state.

### Agent ownership table

| Agent | Owns | Trigger |
|---|---|---|
| `research-runner` | (retired) | one-off Day-1 research pass; no longer maintained |
| `schema-keeper` | `packages/shared/src/schemas/`, `tool-schemas.ts`, `page-config.ts` | Add/modify section type or prop, change tool surface |
| `template-author` | `apps/web/components/templates/*` | Add/modify React section components |
| `api-keeper` | `app/api/chat/route.ts`, `lib/prompts/`, `lib/anthropic.ts` | Modify chat tools, prompts, streaming, caching |
| `db-keeper` | `supabase/migrations/`, `lib/supabase.ts`, `lib/queries/` | Schema changes, queries, RLS |
| `feed-curator` | `lib/mock-data/`, `lib/adapters/mock.ts`, `scripts/seed.ts` | Refresh / expand catalog, on-demand content prompts |
| `youtube-adapter` | `apps/web/lib/innertube/`, `lib/adapters/youtube.ts` | Real YouTube data via Chrome cookies + youtubei.js |
| `debugger` | `__tests__/replays/`, `logs/` (read-only on rest) | Investigate breakage, write replay tests |
| `cache-doctor` | (read-only) | Audit cache hit ratio after prompt/schema changes |

### Skills layered on top

- `claude-api` — invoked when api-keeper writes prompt code; enforces caching from line 1.
- `frontend-design` — invoked when template-author needs a polish pass.
- `simplify` — at end of each milestone.
- `organize` — weekly.
- `init` — to refresh this file.

## Conventions

- **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess: true`. Tests catch this; CI gates on `pnpm typecheck`.
- **Tailwind only** for styling. CSS variables on a wrapper for theming (`--accent`, `--font-scale`).
- **Zod schemas are the single source of truth** — React props, tool inputs, and validators all derive from them.
- **Stable section IDs** survive across patches. Never regenerate them.
- **Append-only migrations**. Never edit a merged SQL file.
- **No comments unless they explain a non-obvious WHY.**
- **Env**: `.env.example` committed; `.env.local` gitignored. Per-developer Anthropic key.

## Cache breakpoint structure (4 segments)

In every chat call, in this order:
1. System role + tool definitions (cacheable, stable)
2. Section schema catalog + tag vocabulary (cacheable, semi-stable)
3. Editing rules + few-shot examples (cacheable, rarely changes)
4. Per-visitor state — current page snapshot + recent preference summary (NOT cacheable across visitors)

Anything appended *before* breakpoint 4 busts the cache for all visitors. After any prompt change, run `cache-doctor`.

## Where decisions live

- `docs/architecture.md` — data flow, patch folding, cache structure. Updated on architectural change.
- `docs/decisions.md` — append-only log: "Decided X because Y on date Z." Every domain agent appends here.
- `docs/ONBOARDING.md` — first-30-minutes guide for new contributors.
- `docs/GLOSSARY.md` — term definitions for non-systems-architecture readers.
- `docs/youtube-adapter.md` — real-YouTube-data path: Chrome cookies + youtubei.js + breakage modes.

## Quick references

- Full plan: `/Users/ejun22/.claude/plans/yes-absolutely-and-sleepy-dewdrop.md`
- Recommended prompts (chip pool): `apps/web/lib/recommended-prompts.ts`
- Demo script: section 13 of the plan file.
