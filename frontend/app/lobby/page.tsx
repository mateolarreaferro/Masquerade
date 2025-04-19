// filepath: /Users/gdmagana/Developer/Github/Masquerade/frontend/app/lobby/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Wheel from '../../components/wheel';
import { io, Socket } from 'socket.io-client';

// Define player interface
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  // Add other properties as needed
}

// Define answer interface
interface Answer {
  playerId: string;
  playerName: string;
  answer: string;
}

// Create a singleton socket instance to be reused across renders
let socketInstance: Socket | null = null;

export default function LobbyPage() {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'join';
    const [lobbyCode, setLobbyCode] = useState('');
    const [username, setUsername] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [isInLobby, setIsInLobby] = useState(false);
    const [error, setError] = useState('');
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [currentAnswerStyle, setCurrentAnswerStyle] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
    const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
    const [answersSubmitted, setAnswersSubmitted] = useState(0);
    const [totalAnswersNeeded, setTotalAnswersNeeded] = useState(0);
    const [showAnswers, setShowAnswers] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    // Use useRef to keep track of the socket instance within the component
    const socketRef = useRef<Socket | null>(null);

    // Initialize socket connection
    useEffect(() => {
        // Create a singleton socket instance if it doesn't exist
        if (!socketInstance) {
            console.log("Creating new socket instance");
            socketInstance = io('http://localhost:3001', {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
        }
        
        // Store the singleton in our ref
        socketRef.current = socketInstance;
        
        const socket = socketRef.current;
        
        socket.on('connect', () => {
            console.log('Connected to game server with ID:', socket.id);
            setIsConnected(true);
            setError('');
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from game server');
            setIsConnected(false);
        });
        
        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError('Failed to connect to game server. Please try again.');
        });

        // Set up event listeners
        socket.on('lobbyCreated', ({ lobbyCode, player }) => {
            console.log('Lobby created:', lobbyCode, player);
            setLobbyCode(lobbyCode);
            setIsInLobby(true);
            setCurrentPlayer(player);
        });
        
        socket.on('lobbyJoined', ({ lobbyCode, player }) => {
            console.log('Lobby joined:', lobbyCode, player);
            setLobbyCode(lobbyCode);
            setIsInLobby(true);
            setCurrentPlayer(player);
        });
        
        socket.on('playerListUpdate', ({ players }) => {
            console.log('Player list updated:', players);
            setPlayers(players);
        });
        
        socket.on('error', ({ message }) => {
            console.error('Server error:', message);
            setError(message);
        });
        
        socket.on('gameStarted', ({ prompt, answerStyle }) => {
            console.log('Game started with prompt:', prompt, 'and style:', answerStyle);
            setIsGameStarted(true);
            setCurrentPrompt(prompt);
            setCurrentAnswerStyle(answerStyle);
            setHasSubmittedAnswer(false);
            setUserAnswer('');
            setAllAnswers([]);
            setShowAnswers(false);
        });

        socket.on('answerReceived', () => {
            console.log('Answer received confirmation');
            setHasSubmittedAnswer(true);
        });

        socket.on('answerProgress', ({ submitted, total }) => {
            console.log('Answer progress:', submitted, '/', total);
            setAnswersSubmitted(submitted);
            setTotalAnswersNeeded(total);
        });

        socket.on('allAnswersSubmitted', ({ answers }) => {
            console.log('All answers submitted:', answers);
            setAllAnswers(answers);
            setShowAnswers(true);
        });

        socket.on('newRound', ({ prompt, answerStyle }) => {
            console.log('New round started with prompt:', prompt, 'and style:', answerStyle);
            setCurrentPrompt(prompt);
            setCurrentAnswerStyle(answerStyle);
            setHasSubmittedAnswer(false);
            setUserAnswer('');
            setAllAnswers([]);
            setShowAnswers(false);
        });
        
        // Make sure we're connected
        if (!socket.connected) {
            console.log('Socket not connected, connecting now...');
            socket.connect();
        }
        
        // Clean up event listeners on component unmount, but don't disconnect the socket
        return () => {
            console.log("Removing socket event listeners");
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('lobbyCreated');
            socket.off('lobbyJoined');
            socket.off('playerListUpdate');
            socket.off('error');
            socket.off('gameStarted');
            socket.off('answerReceived');
            socket.off('answerProgress');
            socket.off('allAnswersSubmitted');
            socket.off('newRound');
            // We're not disconnecting the socket here to allow persistence between page navigations
        };
    }, []);

    const handleCreateLobby = (e) => {
        e.preventDefault();
        if (username.trim().length === 0) {
            setError('Please enter your name');
            return;
        }
        
        console.log("Creating lobby with username:", username);
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('createLobby', { username });
        } else {
            console.error('Socket not connected');
            setError('Not connected to game server. Please refresh the page and try again.');
        }
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
        
        console.log("Joining lobby:", lobbyCode, "with username:", username);
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('joinLobby', { username, lobbyCode: lobbyCode.toUpperCase() });
        } else {
            console.error('Socket not connected');
            setError('Not connected to game server. Please refresh the page and try again.');
        }
    };

    const handleStartGame = () => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('startGame');
        } else {
            setError('Not connected to game server');
        }
    };

    const handleSubmitAnswer = (e) => {
        e.preventDefault();
        if (userAnswer.trim().length === 0) {
            setError('Please enter your answer');
            return;
        }
        
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('submitAnswer', { answer: userAnswer });
        } else {
            setError('Not connected to game server');
        }
    };

    const handleNextRound = () => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('newRound');
        } else {
            setError('Not connected to game server');
        }
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
                        {/* Prompt and Answer Style Display */}
                        <div className="mb-6">
                            <div className="text-center bg-blue-100 dark:bg-blue-900 p-4 rounded-lg mb-4">
                                <h2 className="text-xl font-semibold mb-2">Prompt:</h2>
                                <p className="text-2xl font-bold">{currentPrompt}</p>
                            </div>
                            
                            <div className="text-center bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                                <h3 className="text-md font-medium mb-1">Answer Style:</h3>
                                <p className="text-lg font-semibold">{currentAnswerStyle}</p>
                            </div>
                        </div>

                        {/* Answer Submission Form */}
                        {!hasSubmittedAnswer && !showAnswers ? (
                            <form onSubmit={handleSubmitAnswer} className="mb-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1" htmlFor="userAnswer">
                                        Your Answer:
                                    </label>
                                    <textarea
                                        id="userAnswer"
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Type your answer here..."
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        rows={3}
                                        required
                                    />
                                </div>
                                
                                {error && (
                                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                        {error}
                                    </div>
                                )}
                                
                                <button
                                    type="submit"
                                    className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition duration-300"
                                >
                                    Submit Answer
                                </button>
                            </form>
                        ) : !showAnswers ? (
                            <div className="mb-6 text-center">
                                <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg mb-4">
                                    <p className="text-lg font-medium">Your answer has been submitted!</p>
                                </div>
                                
                                <div className="mt-4">
                                    <p>Waiting for other players...</p>
                                    <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 transition-all duration-500 ease-in-out" 
                                            style={{ width: `${(answersSubmitted / totalAnswersNeeded) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                                        {answersSubmitted} of {totalAnswersNeeded} answers received
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-4 text-center">All Answers:</h2>
                                <ul className="space-y-3">
                                    {allAnswers.map((answer, index) => (
                                        <li 
                                            key={index} 
                                            className="p-3 bg-gray-50 dark:bg-slate-700 rounded-md"
                                        >
                                            <p className="font-medium">{answer.answer}</p>
                                        </li>
                                    ))}
                                </ul>

                                {isHost && (
                                    <button
                                        onClick={handleNextRound}
                                        className="w-full mt-6 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-300"
                                    >
                                        Start Next Round
                                    </button>
                                )}
                            </div>
                        )}
                        
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
                {isConnected ? (
                    <span className="inline-block ml-4 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Connected</span>
                ) : (
                    <span className="inline-block ml-4 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Disconnected</span>
                )}
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
                                disabled={!isConnected}
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