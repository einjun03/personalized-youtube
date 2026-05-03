import type { PageConfig, Section } from '@showcase/shared';

export function CustomNote({ section }: { section: Section; config: PageConfig }) {
  if (section.type !== 'CustomNote') return null;
  const { text, visible } = section.props;
  if (!visible || !text.trim()) return null;

  return (
    <aside className="mx-6 my-3 rounded-lg border border-dashed border-[color:var(--accent)]/40 bg-[color:var(--accent)]/5 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[color:var(--muted-fg)]">Note</p>
      <p className="mt-1 text-sm leading-snug">{text}</p>
    </aside>
  );
}
