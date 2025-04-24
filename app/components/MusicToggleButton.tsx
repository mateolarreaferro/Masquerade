'use client';
import { useAudio } from '@/app/components/AudioProvider';
import { Volume2, VolumeX } from 'lucide-react';

export default function MusicToggleButton() {
  const { toggleLobby, isPlaying } = useAudio();
  return (
    <button
      onClick={toggleLobby}
      className="fixed top-6 left-4 z-50 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-md hover:bg-white dark:hover:bg-slate-800"
      aria-label={isPlaying ? 'Mute music' : 'Play music'}
    >
      {isPlaying ? (
        <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      ) : (
        <VolumeX className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      )}
    </button>
  );
}
