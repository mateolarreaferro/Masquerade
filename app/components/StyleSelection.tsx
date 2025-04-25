import React from 'react';
import SoundButton from './SoundButton';
import { useGameState } from './GameStateProvider';

export function StyleSelection() {
  const { 
    styleOptions, 
    styleSelectingPlayerId, 
    selectedStyle, 
    currentPlayer, 
    selectStyle, 
    players 
  } = useGameState();

  const isSelectingStyle = styleSelectingPlayerId === currentPlayer?.id;
  const selectorName = players.find(p => p.id === styleSelectingPlayerId)?.name;

  return (
    <div className="mb-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">
        {isSelectingStyle
          ? "Choose an Answer Style"
          : `${selectorName || 'Another player'} is choosing an answer style...`}
      </h2>

      {isSelectingStyle ? (
        <div className="space-y-3">
          <p className="text-center mb-4 text-slate-600 dark:text-slate-300">
            Select one of the answer styles below:
          </p>
          {styleOptions.map((style, index) => (
            <SoundButton
              key={index}
              className={`w-full p-4 text-left text-lg rounded-lg border transition-all ${
                selectedStyle === style
                  ? "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 border-purple-300 dark:border-purple-700 shadow-md"
                  : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
              }`}
              onClick={() => selectStyle(style)}
            >
              {style}
            </SoundButton>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-pulse w-16 h-16 text-purple-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Please wait while they choose an answer style...
          </p>
        </div>
      )}
    </div>
  );
}