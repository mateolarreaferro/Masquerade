import React from 'react';
import { Player } from './GameStateProvider';

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
}

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">
        Players
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {sortedPlayers.map((player) => (
          <div
            key={player.id}
            className={`bg-white dark:bg-slate-700 p-3 rounded-lg text-center shadow-sm border ${
              player.id === currentPlayerId
                ? 'border-indigo-300 dark:border-indigo-500'
                : 'border-slate-200 dark:border-slate-600'
            } hover:shadow-md transition`}
          >
            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {player.name}
              {player.id === currentPlayerId && ' (You)'}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              {player.isHost && (
                <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded-full">
                  Host
                </span>
              )}
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {player.score || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}