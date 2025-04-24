import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { AudioProvider } from './components/AudioProvider';
import MusicToggleButton from './components/MusicToggleButton';
import BackgroundParticles from './components/BackgroundParticles';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Masquerade',
  description: "A game where you unmask your friends' true identities",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AudioProvider>
          <BackgroundParticles />            {/* z-40 particle layer */}
          <div className="relative z--10">    {/* UI sits below particles */}
            <MusicToggleButton />
            {children}
          </div>
        </AudioProvider>
      </body>
    </html>
  );
}
