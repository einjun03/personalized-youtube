'use client';

// AmbientBackground — full-bleed background that subscribes to a content
// source (the watch-page playing video). Renders a soft radial-gradient
// blob whose color is derived from the video ID so each video gives a
// distinct, deterministic palette. Optional grain overlay + particle drift.
//
// Generalization: the LLM can drop this anywhere, point it at any source,
// dial intensity / grain / particles, and it'll feel like the page is
// "breathing" with whatever's in focus. No canvas, no color-extraction
// plumbing — palette is hashed from the source ID, which is good enough
// for a hi-fi demo and trivially upgradable to real Vibrant.js extraction.

import { useMemo } from 'react';
import type { PageConfig, Section } from '@showcase/shared';
import { usePageStore } from '@/lib/store';

function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}
function paletteFor(id: string): { c1: string; c2: string; c3: string } {
  const h = hueFromId(id);
  return {
    c1: `hsla(${h}, 60%, 35%, 0.55)`,
    c2: `hsla(${(h + 35) % 360}, 70%, 55%, 0.40)`,
    c3: `hsla(${(h + 220) % 360}, 60%, 25%, 0.55)`,
  };
}

export function AmbientBackground({ section, config }: { section: Section; config: PageConfig }) {
  const { watchingId } = usePageStore();
  // Hooks must run unconditionally; pull source-id before any early return.
  const source = section.type === 'AmbientBackground' ? section.props.source : 'playingVideo';
  const sourceId = useMemo(() => {
    if (source === 'playingVideo') return watchingId ?? '';
    const grid = config.sections.find((s) => s.type === 'VideoGrid');
    if (grid && grid.type === 'VideoGrid') return grid.props.videos[0]?.id ?? '';
    return '';
  }, [source, watchingId, config.sections]);

  if (section.type !== 'AmbientBackground') return null;
  const { visible, intensity, grain, particles } = section.props;
  if (!visible) return null;
  // No watching/top video yet — nothing to sample. Render a fallback dim
  // ambient using the theme accent so the section still feels "on".
  const palette = sourceId.length > 0 ? paletteFor(sourceId) : paletteFor(section.id);
  const { c1, c2, c3 } = palette;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
        style={{
          opacity: intensity,
          background: `
            radial-gradient(ellipse 70% 50% at 30% 30%, ${c1}, transparent 70%),
            radial-gradient(ellipse 60% 40% at 70% 70%, ${c2}, transparent 70%),
            radial-gradient(ellipse 80% 60% at 50% 80%, ${c3}, transparent 70%)
          `,
          filter: 'blur(40px)',
        }}
      />
      {grain > 0 && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            opacity: grain,
            mixBlendMode: 'overlay',
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
      )}
      {particles && particles !== 'none' && (
        <ParticleDrift kind={particles} hue={hueFromId(sourceId)} />
      )}
    </>
  );
}

// Particle drift — each `kind` has its own visual physics so atmospheric
// prompts ("clouds drifting", "rain on the page", "twinkling stars") feel
// distinct. All implementations are CSS-only (no canvas, no rAF).
type ParticleKind = 'mood' | 'snow' | 'embers' | 'clouds' | 'leaves' | 'rain' | 'stars';

function ParticleDrift({ kind, hue }: { kind: ParticleKind; hue: number }) {
  // Per-kind tuning. Each entry has a JSX renderer for one particle.
  if (kind === 'clouds') {
    const count = 7;
    const items = Array.from({ length: count }, (_, i) => i);
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {items.map((i) => {
          const w = 220 + (i * 47) % 180;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                top: `${5 + (i * 17) % 70}%`,
                left: `-${w + 50}px`,
                width: `${w}px`,
                height: `${w * 0.4}px`,
                opacity: 0.55,
                background:
                  'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.6), rgba(255,255,255,0) 60%), radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%), radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.45), rgba(255,255,255,0) 70%)',
                filter: 'blur(8px)',
                animation: `cloud-drift ${60 + (i * 11) % 40}s linear infinite`,
                animationDelay: `-${(i * 7) % 50}s`,
              }}
            />
          );
        })}
        <style jsx>{`
          @keyframes cloud-drift {
            0%   { transform: translateX(0px); }
            100% { transform: translateX(calc(100vw + 400px)); }
          }
        `}</style>
      </div>
    );
  }
  if (kind === 'rain') {
    const count = 70;
    const items = Array.from({ length: count }, (_, i) => i);
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {items.map((i) => (
          <span
            key={i}
            className="absolute block"
            style={{
              left: `${(i * 11) % 100}%`,
              top: `-10%`,
              width: 1,
              height: 18 + (i % 4) * 6,
              background: 'linear-gradient(180deg, rgba(180, 200, 230, 0), rgba(180, 200, 230, 0.55))',
              transform: 'rotate(15deg)',
              animation: `rain-fall ${0.6 + (i % 7) * 0.12}s linear infinite`,
              animationDelay: `-${(i * 0.07) % 1.4}s`,
            }}
          />
        ))}
        <style jsx>{`
          @keyframes rain-fall {
            0%   { transform: translateY(0) rotate(15deg); opacity: 0; }
            10%  { opacity: 0.7; }
            100% { transform: translateY(120vh) rotate(15deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }
  if (kind === 'stars') {
    const count = 60;
    const items = Array.from({ length: count }, (_, i) => i);
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {items.map((i) => (
          <span
            key={i}
            className="absolute block rounded-full"
            style={{
              left: `${(i * 19) % 100}%`,
              top: `${(i * 23) % 100}%`,
              width: 1 + (i % 3),
              height: 1 + (i % 3),
              background: 'white',
              boxShadow: '0 0 4px rgba(255,255,255,0.8)',
              animation: `star-twinkle ${2 + (i % 6) * 0.5}s ease-in-out infinite`,
              animationDelay: `-${(i * 0.13) % 4}s`,
            }}
          />
        ))}
        <style jsx>{`
          @keyframes star-twinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50%      { opacity: 1;   transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }
  if (kind === 'leaves') {
    const count = 16;
    const items = Array.from({ length: count }, (_, i) => i);
    const tints = ['#d97706', '#b45309', '#a16207', '#92400e', '#dc2626'];
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {items.map((i) => (
          <span
            key={i}
            className="absolute block"
            style={{
              left: `${(i * 31) % 100}%`,
              top: `-5%`,
              width: 12 + (i % 3) * 4,
              height: 14 + (i % 3) * 4,
              background: tints[i % tints.length],
              borderRadius: '60% 0 60% 0',
              opacity: 0.7,
              animation: `leaf-fall ${10 + (i % 5) * 2}s linear infinite`,
              animationDelay: `-${(i * 1.3) % 10}s`,
            }}
          />
        ))}
        <style jsx>{`
          @keyframes leaf-fall {
            0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
            10%  { opacity: 0.7; }
            100% { transform: translateY(115vh) translateX(60px) rotate(540deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }
  // mood / snow / embers — original drift logic, vertical rise/fall.
  const count = kind === 'snow' ? 26 : kind === 'embers' ? 22 : 12;
  const tint =
    kind === 'snow' ? 'hsla(0, 0%, 100%, 0.7)' :
    kind === 'embers' ? 'hsla(20, 90%, 65%, 0.7)' :
    `hsla(${hue}, 80%, 70%, 0.55)`;
  const items = Array.from({ length: count }, (_, i) => i);
  // snow falls; mood/embers rise.
  const animName = kind === 'snow' ? 'snow-fall' : 'ambient-drift';
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {items.map((i) => (
        <span
          key={i}
          className="absolute block rounded-full"
          style={{
            left: `${(i * 53) % 100}%`,
            top: kind === 'snow' ? `-5%` : `${(i * 37) % 100}%`,
            width: 4 + (i % 3),
            height: 4 + (i % 3),
            background: tint,
            animation: `${animName} ${kind === 'embers' ? 8 : 14 + (i % 5) * 2}s linear infinite`,
            animationDelay: `-${(i * 1.7) % 14}s`,
            opacity: 0.55,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ambient-drift {
          0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
          15%  { opacity: 0.6; }
          85%  { opacity: 0.6; }
          100% { transform: translateY(-120vh) translateX(20px); opacity: 0; }
        }
        @keyframes snow-fall {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.7; }
          100% { transform: translateY(115vh) translateX(40px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
