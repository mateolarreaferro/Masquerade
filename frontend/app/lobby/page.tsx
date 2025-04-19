// filepath: /Users/gdmagana/Developer/Github/Masquerade/frontend/app/lobby/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Wheel from '../../components/wheel';
import { io } from 'socket.io-client';

// Create a socket instance outside the component
let socket;

export default function Lobby() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mode = searchParams.get('mode');
    
    const [lobbyCode, setLobbyCode] = useState('');
    const [username, setUsername] = useState('');
    const [players, setPlayers] = useState([]);
    const [isInLobby, setIsInLobby] = useState(false);
    const [error, setError] = useState('');
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        if (!socket) {
            socket = io('http://localhost:3001');
            
            socket.on('connect', () => {
                console.log('Connected to game server');
            });
            
            socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                setError('Failed to connect to game server');
            });
        }
        
        // Set up event listeners
        socket.on('lobbyCreated', ({ lobbyCode, player }) => {
            setLobbyCode(lobbyCode);
            setIsInLobby(true);
            setCurrentPlayer(player);
        });
        
        socket.on('lobbyJoined', ({ lobbyCode, player }) => {
            setLobbyCode(lobbyCode);
            setIsInLobby(true);
            setCurrentPlayer(player);
        });
        
        socket.on('playerListUpdate', ({ players }) => {
            setPlayers(players);
        });
        
        socket.on('error', ({ message }) => {
            setError(message);
        });
        
        socket.on('gameStarted', () => {
            setIsGameStarted(true);
        });
        
        // Clean up on component unmount
        return () => {
            socket.off('lobbyCreated');
            socket.off('lobbyJoined');
            socket.off('playerListUpdate');
            socket.off('error');
            socket.off('gameStarted');
        };
    }, []);

    const handleCreateLobby = (e) => {
        e.preventDefault();
        if (username.trim().length === 0) {
            setError('Please enter your name');
            return;
        }
        
        socket.emit('createLobby', { username });
    };

    const handleJoinLobby = (e) => {
        e.preventDefault();
        if (username.trim().length === 0) {
            setError('Please enter your name');
            return;
        }
        
        if (lobbyCode.trim().length === 0) {
            setError('Please enter a lobby code');
            return;
        }
        
        socket.emit('joinLobby', { username, lobbyCode: lobbyCode.toUpperCase() });
    };

    const handleStartGame = () => {
        socket.emit('startGame');
    };

    const isHost = currentPlayer?.isHost;

    // Game interface shown after game has started
    if (isGameStarted) {
        return (
            <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8">
                <header className="mb-8">
                    <div className="flex justify-between items-center">
                        <Link href="/" className="text-blue-600 hover:underline flex items-center">
                            ← Leave Game
                        </Link>
                        <div className="text-gray-600">Lobby: {lobbyCode}</div>
                    </div>
                </header>
                
                <main className="max-w-xl mx-auto w-full">
                    <h1 className="text-3xl font-bold mb-6 text-center">Game in Progress</h1>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        <Wheel />
                        
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-4 text-center">Players</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {players.map((player) => (
                                    <div key={player.id} className="bg-gray-50 dark:bg-slate-700 p-2 rounded-md text-center">
                                        <div className="font-medium">{player.name}</div>
                                        {player.isHost && (
                                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">Host</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
                
                <footer className="mt-8 text-center text-sm text-gray-500">
                    © 2025 Masquerade Game
                </footer>
            </div>
        );
    }

    return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8">
            <header className="mb-8">
                <Link href="/" className="text-blue-600 hover:underline flex items-center">
                    ← Back to Home
                </Link>
            </header>
            
            <main className="max-w-xl mx-auto w-full">
                <h1 className="text-3xl font-bold mb-6 text-center">
                    {mode === 'create' ? 'Create a New Lobby' : 'Join Existing Lobby'}
                </h1>

                {!isInLobby ? (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}
                        
                        <form onSubmit={mode === 'create' ? handleCreateLobby : handleJoinLobby}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1" htmlFor="username">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            {mode === 'join' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1" htmlFor="lobbyCode">
                                        Lobby Code
                                    </label>
                                    <input
                                        type="text"
                                        id="lobbyCode"
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter lobby code"
                                        value={lobbyCode}
                                        onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-300"
                            >
                                {mode === 'create' ? 'Create Lobby' : 'Join Lobby'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        <div className="mb-6 text-center">
                            <div className="mb-4">
                                <p className="text-sm mb-1">Lobby Code:</p>
                                <div className="text-3xl font-mono font-bold bg-gray-100 dark:bg-slate-700 p-3 rounded-lg">
                                    {lobbyCode}
                                </div>
                                <p className="text-xs mt-2 text-gray-500">Share this code with your friends</p>
                            </div>
                            
                            <h2 className="text-xl font-semibold mt-6 mb-4">Players</h2>
                            {players.length === 0 ? (
                                <p className="text-gray-500">Waiting for players to join...</p>
                            ) : (
                                <ul className="space-y-2">
                                    {players.map((player) => (
                                        <li key={player.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded-md">
                                            <span>{player.name}</span>
                                            {player.isHost && (
                                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">Host</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        {isHost && (
                            <button
                                className={`w-full py-2 px-4 font-medium rounded-md transition duration-300 ${
                                    players.length < 2 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                                onClick={handleStartGame}
                                disabled={players.length < 2}
                            >
                                {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
                            </button>
                        )}
                    </div>
                )}
            </main>
            
            <footer className="mt-8 text-center text-sm text-gray-500">
                © 2025 Masquerade Game
            </footer>
        </div>
    );
}