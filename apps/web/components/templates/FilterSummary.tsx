import type { PageConfig, Section } from '@showcase/shared';

export function FilterSummary({ section, config }: { section: Section; config: PageConfig }) {
  if (section.type !== 'FilterSummary') return null;

  const f = config.filter;
  const sort = config.sort;

  const pills: { label: string; tone: 'include' | 'exclude' | 'sort' }[] = [];
  for (const tag of f.requireTags) pills.push({ label: `requires: ${tag}`, tone: 'include' });
  for (const tag of f.exclude) pills.push({ label: `hiding: ${tag}`, tone: 'exclude' });
  for (const tag of f.include) pills.push({ label: `includes: ${tag}`, tone: 'include' });
  for (const ch of f.blockChannels) pills.push({ label: `blocked: ${ch}`, tone: 'exclude' });
  if (f.minDurationSeconds) pills.push({ label: `≥ ${Math.round(f.minDurationSeconds / 60)}m`, tone: 'include' });
  if (f.maxDurationSeconds) pills.push({ label: `≤ ${Math.round(f.maxDurationSeconds / 60)}m`, tone: 'include' });
  if (sort.by !== 'recommended') pills.push({ label: `sort: ${sort.by} ${sort.order}`, tone: 'sort' });

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-[color:var(--border)]">
      <span className="text-xs uppercase tracking-wide text-[color:var(--muted-fg)]">
        Personalized for you:
      </span>
      {pills.map((p, i) => (
        <span
          key={i}
          className={
            'rounded-full px-2.5 py-1 text-xs ' +
            (p.tone === 'include'
              ? 'bg-[color:var(--accent)]/15 text-[color:var(--fg)] border border-[color:var(--accent)]/30'
              : p.tone === 'exclude'
                ? 'bg-[color:var(--muted)] text-[color:var(--muted-fg)] border border-[color:var(--border)] line-through'
                : 'bg-[color:var(--muted)] text-[color:var(--fg)] border border-[color:var(--border)]')
          }
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}
