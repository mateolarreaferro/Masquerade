import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AudioProvider } from "./components/AudioProvider";
import MusicToggleButton from "./components/MusicToggleButton";
import BackgroundParticles from "./components/BackgroundParticles";

import { Brawler } from "next/font/google";

const brawler = Brawler({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brawler",
});

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Masquerade",
  description: "A game where you unmask your friends' true identities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${brawler.variable} antialiased`}
      >
        <AudioProvider>
          {/* UI wrapper */}
          <div className="relative z-10">
            <MusicToggleButton />
            {children}
          </div>

          {/* particles rendered last → always on top */}
          <BackgroundParticles />
        </AudioProvider>
      </body>
    </html>
  );
}
