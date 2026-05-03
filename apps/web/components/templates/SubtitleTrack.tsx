'use client';

// SubtitleTrack — overlay shown on the watch view when a visitor wants
// dual-language captions. Real-time captions need the YouTube Iframe API
// `captionsAvailable` event (or a separate captions adapter); this v0
// renders a static example pair so the UX is testable end-to-end.
//
// Generalization: any language pair works (set primary/secondary). If
// hoverDefine is on, hovering a span opens a vocab tooltip; click to pin.

import type { PageConfig, Section } from '@showcase/shared';

const SAMPLE_LINES: Record<string, { primary: string; secondary: string; hover?: { word: string; pos: string; gloss: string } }> = {
  ko: {
    primary: '어떤 사이즈로 드릴까요?',
    secondary: 'What size would you like?',
    hover: { word: '사이즈', pos: 'noun · loanword (size)', gloss: '"size" — used here with the instrumental particle 로.' },
  },
  ja: {
    primary: 'コーヒーをお願いします。',
    secondary: 'A coffee, please.',
    hover: { word: 'お願いします', pos: 'verb phrase · polite request', gloss: 'literally "I humbly request"; used to politely ask.' },
  },
  es: {
    primary: '¿De qué tamaño la quiere?',
    secondary: 'What size would you like?',
    hover: { word: 'tamaño', pos: 'noun', gloss: 'size; the diacritic ñ marks a palatal nasal.' },
  },
  fr: {
    primary: 'Quelle taille voulez-vous?',
    secondary: 'What size would you like?',
    hover: { word: 'taille', pos: 'noun', gloss: 'size or cut; also used for clothing sizing.' },
  },
};

export function SubtitleTrack({ section }: { section: Section; config: PageConfig }) {
  if (section.type !== 'SubtitleTrack') return null;
  const { visible, primary, secondary, hoverDefine, position } = section.props;
  if (!visible) return null;

  const sample = SAMPLE_LINES[primary] ?? SAMPLE_LINES['ko']!;
  const dock = position === 'docked';

  const overlay = (
    <div
      className={
        dock
          ? 'mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] px-4 py-3 text-center'
          : 'pointer-events-none absolute inset-x-0 bottom-6 z-30 mx-auto w-[90%] max-w-3xl text-center'
      }
      style={!dock ? { textShadow: '0 2px 8px rgba(0,0,0,0.8)' } : undefined}
    >
      <p
        className={
          dock
            ? 'text-base font-medium text-[color:var(--fg)]'
            : 'text-xl font-medium text-white'
        }
        style={{ fontFamily: primary === 'ko' ? '"Noto Sans KR", sans-serif' : undefined }}
      >
        {hoverDefine && sample.hover ? (
          <span>
            {sample.primary.split(sample.hover.word).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span
                    className="cursor-help underline decoration-dashed decoration-yellow-200/60 underline-offset-4"
                    title={`${sample.hover!.pos} — ${sample.hover!.gloss}`}
                  >
                    {sample.hover!.word}
                  </span>
                )}
              </span>
            ))}
          </span>
        ) : (
          sample.primary
        )}
      </p>
      {secondary && (
        <p
          className={
            dock
              ? 'mt-1 text-sm text-[color:var(--muted-fg)]'
              : 'mt-1 text-base text-yellow-100/90'
          }
        >
          {sample.secondary}
        </p>
      )}
      <p className="mt-2 text-[10px] uppercase tracking-wider text-[color:var(--muted-fg)]/70">
        captions · {primary}{secondary ? ` + ${secondary}` : ''}{hoverDefine ? ' · hover-define' : ''}
      </p>
    </div>
  );

  return overlay;
}
