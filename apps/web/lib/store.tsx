'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { applyPatch, type PageConfig, type Patch } from '@showcase/shared';

export interface YtChipEntry {
  text: string;
  params: string | null;
}

export type NavKey = 'Home' | 'Shorts' | 'Subscriptions' | 'You' | 'Library' | 'History';

interface PageStoreValue {
  config: PageConfig;
  pageSlug: string;
  dispatch: (patch: Patch, options?: { persist?: boolean; rationale?: string }) => void;
  replace: (config: PageConfig) => void;
  // YouTube-source extras: continuation token for infinite scroll, mutable
  // so the grid can update it after each /api/yt/more page lands.
  ytContinuation: string | null;
  setYtContinuation: (token: string | null) => void;
  // Real chip metadata extracted from the home browse response. Map text → params token.
  ytChips: YtChipEntry[];
  // Whether the YouTube data adapter is active. Set once at page render time
  // from the server (env var SHOWCASE_FEED_SOURCE). Components use this to
  // decide whether to call /api/yt/* endpoints vs. local-only filtering.
  youtubeMode: boolean;
  // Currently-watched video for the in-app embed overlay; null when closed.
  watchingId: string | null;
  watchingTitle: string | null;
  setWatching: (id: string | null, title?: string | null) => void;
  // Sidebar navigation: which top-level nav item is active and (when in
  // Subscriptions mode) which channel is selected. Local-only state, doesn't
  // round-trip through the patch system since it doesn't change PageConfig.
  activeNav: NavKey;
  selectedChannel: string | null;
  setActiveNav: (key: NavKey, channel?: string | null) => void;
}

const PageStoreContext = createContext<PageStoreValue | null>(null);

export function PageStoreProvider({
  initialConfig,
  initialYtContinuation = null,
  initialYtChips = [],
  initialYoutubeMode = false,
  initialWatchingId = null,
  pageSlug,
  children,
}: {
  initialConfig: PageConfig;
  initialYtContinuation?: string | null;
  initialYtChips?: YtChipEntry[];
  initialYoutubeMode?: boolean;
  initialWatchingId?: string | null;
  pageSlug: string;
  children: ReactNode;
}) {
  const [config, setConfig] = useState<PageConfig>(initialConfig);
  const [ytContinuation, setYtContinuation] = useState<string | null>(initialYtContinuation);
  const [watchingId, setWatchingId] = useState<string | null>(initialWatchingId);
  const [watchingTitle, setWatchingTitle] = useState<string | null>(null);
  const [activeNav, setActiveNavState] = useState<NavKey>('Home');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const setActiveNav = useCallback((key: NavKey, channel?: string | null) => {
    setActiveNavState(key);
    setSelectedChannel(typeof channel === 'string' ? channel : null);
  }, []);
  const setWatching = useCallback((id: string | null, title?: string | null) => {
    setWatchingId(id);
    setWatchingTitle(typeof title === 'string' ? title : null);
  }, []);
  const youtubeMode = initialYoutubeMode;
  const dispatch = useCallback(
    (patch: Patch, options?: { persist?: boolean; rationale?: string }) => {
      setConfig((current) => applyPatch(current, patch));
      if (options?.persist) {
        // fire-and-forget; UI already updated optimistically
        fetch('/api/patch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: pageSlug, patch, rationale: options.rationale }),
        }).catch(() => {
          // best-effort persistence
        });
      }
    },
    [pageSlug],
  );
  const replace = useCallback((next: PageConfig) => setConfig(next), []);
  return (
    <PageStoreContext.Provider
      value={{
        config,
        pageSlug,
        dispatch,
        replace,
        ytContinuation,
        setYtContinuation,
        ytChips: initialYtChips,
        youtubeMode,
        watchingId,
        watchingTitle,
        setWatching,
        activeNav,
        selectedChannel,
        setActiveNav,
      }}
    >
      {children}
    </PageStoreContext.Provider>
  );
}

export function usePageStore(): PageStoreValue {
  const value = useContext(PageStoreContext);
  if (!value) {
    throw new Error('usePageStore must be used within a PageStoreProvider');
  }
  return value;
}
