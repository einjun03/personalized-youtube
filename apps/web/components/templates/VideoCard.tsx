'use client';

import { useEffect, useRef, useState } from 'react';
import type { PageConfig, Video } from '@showcase/shared';
import { usePageStore } from '@/lib/store';
import { Avatar } from './Avatar';

const ASPECT_RATIO = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
} as const;

const HOVER = {
  none: '',
  lift: 'transition-transform duration-200 hover:-translate-y-0.5',
  zoom: 'transition-transform duration-200 hover:scale-[1.02]',
} as const;

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function VideoCard({
  video,
  config,
  watchedFraction,
}: {
  video: Video;
  config: PageConfig;
  watchedFraction?: number;
}) {
  const cardDefaults = config.theme.videoCardDefaults;
  const aspectClass = ASPECT_RATIO[cardDefaults.aspectRatio];
  const hoverClass = HOVER[cardDefaults.hoverEffect];
  const horizontal = cardDefaults.cardLayout === 'horizontal';
  const saturate = cardDefaults.thumbnailSaturate ?? 1;
  const hideMeta = cardDefaults.hideMeta ?? false;
  const isWatched = video.watched === true;
  const watchedMode = config.filter.showWatchedOverlay && isWatched;
  const [hidden, setHidden] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setHidden(true);
  }, []);

  if (hidden) return null;

  const thumb = (
    <div className={`relative overflow-hidden rounded-xl bg-[color:var(--muted)] ${aspectClass} ${horizontal ? 'w-1/2 shrink-0' : ''}`}>
      <img
        ref={imgRef}
        src={video.thumbnail}
        alt={video.title}
        loading="lazy"
        onError={() => setHidden(true)}
        className="h-full w-full object-cover"
        style={saturate !== 1 ? { filter: `saturate(${saturate})` } : undefined}
      />
      {cardDefaults.showDuration && (
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
          {video.duration}
        </span>
      )}
      {watchedMode && (
        <span className="absolute left-2 top-2 rounded bg-black/85 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/80">
          Watched
        </span>
      )}
      {typeof watchedFraction === 'number' && watchedFraction > 0 && (
        <span
          className="absolute bottom-0 left-0 h-0.5 bg-[color:var(--accent)]"
          style={{ width: `${Math.min(100, Math.max(0, watchedFraction * 100))}%` }}
        />
      )}
    </div>
  );

  const meta = (
    <div className={`flex gap-3 ${horizontal ? 'min-w-0 flex-1 items-start' : ''}`}>
      {!horizontal && (
        <Avatar name={video.channel.name} src={video.channel.avatar} size="md" />
      )}
      <div className="min-w-0">
        <h3
          className={`line-clamp-2 leading-snug ${horizontal ? 'text-base' : 'text-sm'}`}
          style={{ fontWeight: cardDefaults.titleWeight }}
        >
          {video.title}
        </h3>
        <p
          className="mt-1 truncate text-xs text-[color:var(--muted-fg)]"
          style={{ fontWeight: cardDefaults.channelNameWeight }}
        >
          {video.channel.name}
          {video.channel.verified && <span className="ml-1">✓</span>}
        </p>
        {!hideMeta && (cardDefaults.showViewCount || cardDefaults.showPostedAgo) && (
          <p className="mt-0.5 text-xs text-[color:var(--muted-fg)]">
            {cardDefaults.showViewCount && `${formatViews(video.views)} views`}
            {cardDefaults.showViewCount && cardDefaults.showPostedAgo && ' · '}
            {cardDefaults.showPostedAgo && video.postedAgo}
          </p>
        )}
        {(cardDefaults.showDescription || horizontal) && video.description && (
          <p className="mt-1 line-clamp-2 text-xs text-[color:var(--muted-fg)]">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );

  const { setWatching, youtubeMode } = usePageStore();
  const watchHref = `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;

  function onCardClick(e: React.MouseEvent): void {
    // Cmd/Ctrl-click or middle-click → fall through to native open-in-new-tab.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    // In YouTube mode the embed iframe will load this video. In mock mode we
    // don't have real YouTube IDs, so let the link open externally.
    if (!youtubeMode) return;
    e.preventDefault();
    setWatching(video.id, video.title);
  }

  const watchedDim = watchedMode ? 'opacity-40' : '';

  if (horizontal) {
    return (
      <a
        href={watchHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onCardClick}
        className={`group flex gap-4 cursor-pointer ${hoverClass} ${watchedDim}`}
      >
        {thumb}
        {meta}
      </a>
    );
  }

  return (
    <a
      href={watchHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onCardClick}
      className={`group flex flex-col gap-3 cursor-pointer ${hoverClass} ${watchedDim}`}
    >
      {thumb}
      {meta}
    </a>
  );
}
