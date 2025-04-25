import React from 'react';
import SoundButton from './SoundButton';
import { useGameState } from './GameStateProvider';

export function PromptSelection() {
  const { 
    promptOptions, 
    promptSelectingPlayerId, 
    selectedPrompt, 
    currentPlayer, 
    selectPrompt, 
    players 
  } = useGameState();

  const isSelectingPrompt = promptSelectingPlayerId === currentPlayer?.id;
  const selectorName = players.find(p => p.id === promptSelectingPlayerId)?.name;

  return (
    <div className="mb-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">
        {isSelectingPrompt
          ? "Choose a Prompt"
          : `${selectorName || 'Another player'} is choosing a prompt...`}
      </h2>

      {isSelectingPrompt ? (
        <div className="space-y-3">
          <p className="text-center mb-4 text-slate-600 dark:text-slate-300">
            Select one of the prompts below:
          </p>
          {promptOptions.map((prompt, index) => (
            <SoundButton
              key={index}
              className={`w-full p-4 text-left text-lg rounded-lg border transition-all ${
                selectedPrompt === prompt
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 border-blue-300 dark:border-blue-700 shadow-md"
                  : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
              }`}
              onClick={() => selectPrompt(prompt)}
            >
              {prompt}
            </SoundButton>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-pulse w-16 h-16 text-indigo-500">
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
                  d="M19 11H5m14 0a2 2 012 2v6a2 2 01-2 2H5a2 2 01-2-2v-6a2 2 012-2m14 0V9a2 2 00-2-2M5 11V9a2 2 00-2-2m0 0V5a2 2 012-2h6a2 2 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Please wait while they choose...
          </p>
        </div>
      )}
    </div>
  );
}