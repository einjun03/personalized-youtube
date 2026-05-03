import type { PageConfig, Section } from '@showcase/shared';
import { VideoCard } from './VideoCard';

export function ContinueWatchingRow({ section, config }: { section: Section; config: PageConfig }) {
  if (section.type !== 'ContinueWatchingRow') return null;
  const { visible, headline, videos } = section.props;
  if (!visible || videos.length === 0) return null;

  return (
    <section className="px-6 py-3">
      <h2 className="mb-3 text-base font-semibold">{headline}</h2>
      <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4">
          {videos.slice(0, 6).map((v, i) => {
            const fakeProgress = 0.15 + ((i * 13) % 70) / 100;
            return (
              <div key={v.id} className="w-72 shrink-0">
                <VideoCard video={v} config={config} watchedFraction={fakeProgress} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
