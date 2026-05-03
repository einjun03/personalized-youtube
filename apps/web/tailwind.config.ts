import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        'muted-fg': 'var(--muted-fg)',
        border: 'var(--border)',
      },
      fontSize: {
        scaled: 'calc(1rem * var(--font-scale, 1))',
      },
      fontFamily: {
        sans: ['var(--font-sans-loaded)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif-loaded)', 'Georgia', 'serif'],
        mono: ['var(--font-mono-loaded)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        rounded: ['var(--font-rounded-loaded)', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
