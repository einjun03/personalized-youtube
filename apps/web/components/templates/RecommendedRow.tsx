import type { PageConfig, Section } from '@showcase/shared';
import { VideoCard } from './VideoCard';
import { applyFeedFilter } from './_filter';

export function RecommendedRow({ section, config }: { section: Section; config: PageConfig }) {
  if (section.type !== 'RecommendedRow') return null;
  const { headline, videos } = section.props;
  const filtered = applyFeedFilter(videos, config).slice(0, 8);
  if (filtered.length === 0) return null;

  return (
    <section className="px-6 py-3">
      <h2 className="mb-3 text-base font-semibold">{headline}</h2>
      <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4">
          {filtered.map((v) => (
            <div key={v.id} className="w-72 shrink-0">
              <VideoCard video={v} config={config} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
