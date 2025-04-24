'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Howl, Howler } from 'howler';

type AudioCtx = {
  playLobby: () => void;
  stopLobby: () => void;
  toggleLobby: () => void;
  isPlaying: boolean;
};

const Ctx = createContext<AudioCtx | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const lobbyRef = useRef<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureLobby = () =>
    lobbyRef.current ??
    (lobbyRef.current = new Howl({
      src: ['/audio/LobbyMusic.wav'],
      loop: true,
      volume: 0.7,
    }));

  /* —— stable callbacks —— */
  const playLobby = useCallback(() => {
    const h = ensureLobby();
    if (!h.playing()) h.play();
    setIsPlaying(true);
  }, []);

  const stopLobby = useCallback(() => {
    lobbyRef.current?.stop();
    setIsPlaying(false);
  }, []);

  const toggleLobby = useCallback(() => {
    setIsPlaying((p) => {
      if (p) {
        lobbyRef.current?.stop();
        return false;
      } else {
        const h = ensureLobby();
        if (!h.playing()) h.play();
        return true;
      }
    });
  }, []);
  /* ———————————————— */

  /* unlock Web Audio on first gesture */
  useEffect(() => {
    const resume = () => {
      if (Howler.ctx.state === 'suspended') (Howler.ctx as any).resume();
      if (!lobbyRef.current?.playing()) playLobby();
    };
    window.addEventListener('pointerdown', resume, { once: true });
    return () => window.removeEventListener('pointerdown', resume);
  }, [playLobby]);

  return (
    <Ctx.Provider
      value={{ playLobby, stopLobby, toggleLobby, isPlaying }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudio must be used inside <AudioProvider>');
  return ctx;
}
