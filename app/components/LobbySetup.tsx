import React, { useState } from 'react';
import Link from 'next/link';
import SoundButton from './SoundButton';
import SoundLink from './SoundLink';
import { useGameState } from './GameStateProvider';
import { useSocket } from './SocketProvider';

interface LobbySetupProps {
  mode: string;
}

export function LobbySetup({ mode }: LobbySetupProps) {
  const { createLobby, joinLobby, error, isInLobby, lobbyCode, players, currentPlayer, startGame } = useGameState();
  const { isConnected } = useSocket();
  const [username, setUsername] = useState('');
  const [inputLobbyCode, setInputLobbyCode] = useState('');
  
  const handleCreateLobby = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createLobby(username);
  };

  const handleJoinLobby = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    joinLobby(username, inputLobbyCode);
  };

  // If already in a lobby, show the lobby information
  if (isInLobby) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="mb-6 text-center">
          <div className="mb-4">
            <p className="text-sm mb-1">Lobby Code:</p>
            <div className="text-3xl font-mono font-bold bg-gray-100 dark:bg-slate-700 p-3 rounded-lg">
              {lobbyCode}
            </div>
            <p className="text-xs mt-2 text-gray-500">
              Share this code with your friends
            </p>
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-4">Players</h2>
          {players.length === 0 ? (
            <p className="text-gray-500">
              Waiting for players to join...
            </p>
          ) : (
            <ul className="space-y-2">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded-md"
                >
                  <span>{player.name}{player.id === currentPlayer?.id ? ' (You)' : ''}</span>
                  {player.isHost && (
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                      Host
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {currentPlayer?.isHost && (
          <SoundButton
            className={`w-full py-2 px-4 font-medium rounded-md transition duration-300 ${
              players.length < 2
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            onClick={() => currentPlayer?.isHost && players.length >= 2 && startGame()}
            disabled={players.length < 2}
          >
            {players.length < 2
              ? "Need at least 2 players"
              : "Start Game"}
          </SoundButton>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
      {error && (
        <div
          className={`mb-5 p-4 border rounded-lg ${
            error.includes("can only join between rounds")
              ? "bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
              : "bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          }`}
        >
          {error.includes("can only join between rounds") ? (
            <>
              <h3 className="font-medium mb-1">Game in Progress</h3>
              <p>
                You can join this game when the current round finishes
                and players are selecting a new prompt.
              </p>
              <p className="text-sm mt-2">Try again in a moment!</p>
            </>
          ) : (
            error
          )}
        </div>
      )}

      <form
        onSubmit={mode === "create" ? handleCreateLobby : handleJoinLobby}
        className="space-y-5"
      >
        <div>
          <label
            className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300"
            htmlFor="username"
          >
            Your Name
          </label>
          <input
            type="text"
            id="username"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {mode === "join" && (
          <div>
            <label
              className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300"
              htmlFor="lobbyCode"
            >
              Lobby Code
            </label>
            <input
              type="text"
              id="lobbyCode"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition tracking-wider text-center font-mono uppercase"
              placeholder="Enter lobby code"
              value={inputLobbyCode}
              onChange={(e) =>
                setInputLobbyCode(e.target.value.toUpperCase())
              }
              maxLength={4}
              required
            />
          </div>
        )}

        <SoundButton
          type="submit"
          className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg shadow-md flex items-center justify-center transition duration-300 ${
            isConnected
              ? "hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg"
              : "opacity-60 cursor-not-allowed"
          }`}
          disabled={!isConnected}
        >
          {mode === "create" ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 011-1z"
                  clipRule="evenodd"
                />
              </svg>{" "}
              Create Lobby
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 8a1 1 011-1h12a1 1 110 2H4a1 1 01-1-1z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M3 14a1 1 011-1h12a1 1 110 2H4a1 1 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>{" "}
              Join Lobby
            </>
          )}
        </SoundButton>

        <div className="mt-2 text-sm text-center text-slate-600 dark:text-slate-400">
          <p>You can now join games that are in between rounds!</p>
        </div>

        {mode === "create" ? (
          <div className="text-center pt-4">
            <SoundLink
              href="?mode=join"
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium hover:underline"
            >
              Already have a code? Join an existing lobby
            </SoundLink>
          </div>
        ) : (
          <div className="text-center pt-4">
            <SoundLink
              href="?mode=create"
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium hover:underline"
            >
              Want to host? Create a new lobby
            </SoundLink>
          </div>
        )}
      </form>
    </div>
  );
}