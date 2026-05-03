'use client';

// WatchHistoryToggle — small button that flips filter.hideWatched. Exposed
// as a section so visitors can ask the LLM to "always give me a way to
// hide what I've watched" and the LLM emits an add_section. Lives in the
// sidebar by default; can also dock inline above the grid.

import type { PageConfig, Section } from '@showcase/shared';
import { usePageStore } from '@/lib/store';

export function WatchHistoryToggle({ section, config }: { section: Section; config: PageConfig }) {
  const { dispatch } = usePageStore();
  if (section.type !== 'WatchHistoryToggle') return null;
  const { visible, position } = section.props;
  if (!visible) return null;

  const hidden = config.filter.hideWatched ?? false;
  const overlayOn = config.filter.showWatchedOverlay ?? false;
  const padding = position === 'sidebar' ? 'px-3 py-2 mx-2 my-2' : 'mx-6 my-3';

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--muted)] ${padding}`}
    >
      <div>
        <p className="text-xs font-medium">Watched videos</p>
        <p className="text-[10px] text-[color:var(--muted-fg)]">
          {hidden ? 'Hidden from feed' : overlayOn ? 'Dimmed with badge' : 'Shown normally'}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() =>
            dispatch(
              { op: 'set_filter', filter: { hideWatched: false, showWatchedOverlay: !overlayOn } },
              { persist: true, rationale: 'WatchHistoryToggle: dim mode' },
            )
          }
          className={`rounded-full border px-2 py-0.5 text-[10px] ${
            overlayOn && !hidden
              ? 'border-transparent bg-[color:var(--accent)] text-[color:var(--accent-fg)]'
              : 'border-[color:var(--border)]'
          }`}
        >
          Dim
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch(
              { op: 'set_filter', filter: { hideWatched: !hidden, showWatchedOverlay: false } },
              { persist: true, rationale: 'WatchHistoryToggle: hide mode' },
            )
          }
          className={`rounded-full border px-2 py-0.5 text-[10px] ${
            hidden
              ? 'border-transparent bg-[color:var(--accent)] text-[color:var(--accent-fg)]'
              : 'border-[color:var(--border)]'
          }`}
        >
          Hide
        </button>
      </div>
    </div>
  );
}
