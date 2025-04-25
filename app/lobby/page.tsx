// filepath: /Users/gdmagana/Developer/Github/Masquerade/frontend/app/lobby/page.js
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SoundLink from "../components/SoundLink";
import { SocketProvider } from "../components/SocketProvider";
import { GameStateProvider } from "../components/GameStateProvider";
import { PlayerList } from "../components/PlayerList";
import { LobbySetup } from "../components/LobbySetup";
import { PromptSelection } from "../components/PromptSelection";
import { StyleSelection } from "../components/StyleSelection";
import { AnswerSubmission } from "../components/AnswerSubmission";
import { VotingPhase } from "../components/VotingPhase";
import { ResultsDisplay } from "../components/ResultsDisplay";
import { useSocket } from "../components/SocketProvider";
import { useGameState } from "../components/GameStateProvider";

// Main content component that uses useSearchParams
function LobbyContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "join";
  const { isConnected } = useSocket();
  const { 
    isInLobby, 
    isGameStarted, 
    lobbyCode, 
    currentPlayer,
    isPromptSelectionPhase,
    isStyleSelectionPhase,
    isVotingPhase,
    showAnswers,
    players
  } = useGameState();

  // Game interface shown after game has started
  if (isGameStarted) {
    return (
      <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="p-6 sm:p-8">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <SoundLink
              href="/"
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline flex items-center transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 14.707a1 1 01-1.414 0l-4-4a1 1 010-1.414l4-4a1 1 011.414 1.414L7.414 9H15a1 1 110 2H7.414l2.293 2.293a1 1 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Leave Game
            </SoundLink>
            <div className="bg-white dark:bg-slate-700 shadow-sm px-4 py-2 rounded-full text-sm font-medium text-indigo-800 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800">
              Lobby: {lobbyCode}
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-8 flex items-start justify-center">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-slate-800 dark:text-slate-100">
              Game in Progress
            </h1>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              {/* Render appropriate component based on game phase */}
              {isPromptSelectionPhase && <PromptSelection />}
              {isStyleSelectionPhase && <StyleSelection />}
              {!isPromptSelectionPhase && !isStyleSelectionPhase && !isVotingPhase && !showAnswers && <AnswerSubmission />}
              {isVotingPhase && <VotingPhase />}
              {showAnswers && <ResultsDisplay />}

              {/* Always show player list */}
              <PlayerList players={players} currentPlayerId={currentPlayer?.id} />
            </div>
          </div>
        </main>

        <footer className="p-6 sm:p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 Masquerade Game
          </p>
        </footer>
      </div>
    );
  }

  // Lobby setup interface
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="p-6 sm:p-8">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <SoundLink
            href="/"
            className="font-freakshow text-xl dark:text-indigo-200 text-center mt-2 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline flex items-center transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 14.707a1 1 01-1.414 0l-4-4a1 1 010-1.414l4-4a1 1 011.414 1.414L7.414 9H15a1 1 110 2H7.414l2.293 2.293a1 1 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </SoundLink>
          {isConnected ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-500 mr-1.5"></span>
              Disconnected
            </span>
          )}
        </div>
      </header>

      <main className="px-4 sm:px-8 flex items-start justify-center">
        <div className="w-full max-w-xl">
          <h1 className="font-freakshow text-6xl font-bold dark:text-indigo-200 text-center mt-2 mb-8">
            {mode === "create" ? "Create a New Lobby" : "Join Existing Lobby"}
          </h1>

          <LobbySetup mode={mode} />
        </div>
      </main>

      <footer className="p-6 sm:p-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © 2025 Masquerade Game
        </p>
      </footer>
    </div>
  );
}

// Wrapper component with providers for context
function LobbyWithProviders() {
  return (
    <SocketProvider>
      <GameStateProvider>
        <LobbyContent />
      </GameStateProvider>
    </SocketProvider>
  );
}

// Export the main component that wraps the lobby content in Suspense
export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      }
    >
      <LobbyWithProviders />
    </Suspense>
  );
}
