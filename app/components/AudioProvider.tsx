'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';

type AudioCtx = { playLobby: () => void; stopLobby: () => void };
const Ctx = createContext<AudioCtx | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  /* one Howl instance for the whole app */
  const lobbyRef = useRef<Howl | null>(null);
  const ensureLobby = () => {
    if (!lobbyRef.current) {
      lobbyRef.current = new Howl({
        src: ['/audio/LobbyMusic.wav'],
        loop: true,
        volume: 0.7,
      });
    }
    return lobbyRef.current;
  };

  const playLobby = () => {
    const howl = ensureLobby();
    if (!howl.playing()) howl.play();
  };

  const stopLobby = () => {
    lobbyRef.current?.stop();
  };

  /* unlock + autoplay after first user gesture */
  useEffect(() => {
    const resume = () => {
      if (Howler.ctx.state === 'suspended') {
        (Howler.ctx as any).resume();
      }
      playLobby();               // (re)start once audio is allowed
    };
    window.addEventListener('pointerdown', resume, { once: true });
    return () => window.removeEventListener('pointerdown', resume);
  }, []);

  return (
    <Ctx.Provider value={{ playLobby, stopLobby }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudio must be used inside <AudioProvider>');
  return ctx;
}
