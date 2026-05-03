import type { Metadata } from 'next';
import { Inter, Lora, JetBrains_Mono, Nunito } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans-loaded' });
const lora = Lora({ subsets: ['latin'], variable: '--font-serif-loaded' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-loaded' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-rounded-loaded' });

export const metadata: Metadata = {
  title: 'Showcase — Personalizable YouTube',
  description: 'Talk to your homepage. Personalize the look, the recommendations, and the layout. Preferences stick.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${lora.variable} ${jetbrains.variable} ${nunito.variable}`}
    >
      <body className="bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
