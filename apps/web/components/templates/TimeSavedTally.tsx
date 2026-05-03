'use client';

// TimeSavedTally — sidebar widget that shows cumulative minutes "saved"
// by chapter-skipping (sponsor / intro / outro auto-skip). Pure UI: the
// number lives in props (settable by the player when it auto-seeks past
// a tagged segment, or by the LLM as a celebratory placeholder).

import type { PageConfig, Section } from '@showcase/shared';

export function TimeSavedTally({ section }: { section: Section; config: PageConfig }) {
  if (section.type !== 'TimeSavedTally') return null;
  const { visible, position, minutesSavedThisWeek } = section.props;
  if (!visible) return null;

  const m = Math.round(minutesSavedThisWeek);
  const padding = position === 'sidebar' ? 'mx-2 my-3 px-3 py-3' : 'mx-6 my-3 px-4 py-3';

  return (
    <div className={`rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] ${padding}`}>
      <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted-fg)]">Time saved this week</p>
      <p className="mt-1 text-lg font-semibold">{m} min</p>
      <p className="mt-0.5 text-[10px] text-[color:var(--muted-fg)]">
        from skipped sponsors, intros, and outros
      </p>
    </div>
  );
}
