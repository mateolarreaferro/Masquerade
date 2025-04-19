// filepath: /Users/gdmagana/Developer/Github/Masquerade/frontend/app/lobby/page.js
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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

// Create a client component wrapper for the parts that use useSearchParams
function LobbyContent() {
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
            // Use the domain name for production, localhost for development
            const socketUrl = process.env.NODE_ENV === 'production' 
                ? 'https://games.gabema.ga' 
                : 'http://localhost:3001';
            
            socketInstance = io(socketUrl, {
                // Enable all transports, starting with websocket but falling back to polling if needed
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                timeout: 10000,
                path: '/socket.io'
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
            setError('Failed to connect to game server. Please check if the server is running and try again.');
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

    // Reset state when leaving or disconnecting from a lobby
    useEffect(() => {
        return () => {
            console.log("Cleaning up lobby state");
            setIsInLobby(false);
            setLobbyCode('');
            setPlayers([]);
            setIsGameStarted(false);
            setCurrentPlayer(null);
            setCurrentPrompt('');
            setCurrentAnswerStyle('');
            setUserAnswer('');
            setHasSubmittedAnswer(false);
            setAllAnswers([]);
            setAnswersSubmitted(0);
            setTotalAnswersNeeded(0);
        };
    }, []);

    // Interface for the data sent when creating a lobby
    interface CreateLobbyPayload {
        username: string;
    }

    const handleCreateLobby = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (username.trim().length === 0) {
            setError('Please enter your name');
            return;
        }
        
        console.log("Creating lobby with username:", username);
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('createLobby', { username } as CreateLobbyPayload);
        } else {
            console.error('Socket not connected');
            setError('Not connected to game server. Please refresh the page and try again.');
        }
    };

    // Interface for the data sent when joining a lobby
    interface JoinLobbyPayload {
      username: string;
      lobbyCode: string;
    }

    const handleJoinLobby = (e: React.FormEvent<HTMLFormElement>) => {
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
            socketRef.current.emit('joinLobby', { 
                username, 
                lobbyCode: lobbyCode.toUpperCase() 
            } as JoinLobbyPayload);
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

    // Interface for the data sent when submitting an answer
    interface SubmitAnswerPayload {
        answer: string;
    }

    const handleSubmitAnswer = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (userAnswer.trim().length === 0) {
            setError('Please enter your answer');
            return;
        }
        
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('submitAnswer', { answer: userAnswer } as SubmitAnswerPayload);
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
            <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <header className="p-6 sm:p-8">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <Link href="/" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline flex items-center transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Leave Game
                        </Link>
                        <div className="bg-white dark:bg-slate-700 shadow-sm px-4 py-2 rounded-full text-sm font-medium text-indigo-800 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800">
                            Lobby: {lobbyCode}
                        </div>
                    </div>
                </header>
                
                <main className="px-4 sm:px-8 flex items-start justify-center">
                    <div className="w-full max-w-2xl">
                        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-slate-800 dark:text-slate-100">Game in Progress</h1>
                        
                        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                            {/* Prompt and Answer Style Display */}
                            <div className="mb-8 space-y-4">
                                <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 p-5 sm:p-6 rounded-xl shadow-inner border border-blue-100 dark:border-blue-800">
                                    <h2 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-300">Prompt:</h2>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{currentPrompt}</p>
                                </div>
                                
                                <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 p-4 sm:p-5 rounded-xl shadow-inner border border-purple-100 dark:border-purple-800">
                                    <h3 className="text-md font-medium mb-1 text-purple-800 dark:text-purple-300">Answer Style:</h3>
                                    <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">{currentAnswerStyle}</p>
                                </div>
                            </div>

                            {/* Answer Submission Form */}
                            {!hasSubmittedAnswer && !showAnswers ? (
                                <form onSubmit={handleSubmitAnswer} className="mb-8">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300" htmlFor="userAnswer">
                                            Your Answer:
                                        </label>
                                        <textarea
                                            id="userAnswer"
                                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition"
                                            placeholder="Type your answer here..."
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            rows={4}
                                            required
                                        />
                                    </div>
                                    
                                    {error && (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
                                            {error}
                                        </div>
                                    )}
                                    
                                    <button
                                        type="submit"
                                        className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center justify-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Submit Answer
                                    </button>
                                </form>
                            ) : !showAnswers ? (
                                <div className="mb-8">
                                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg shadow-inner border border-green-100 dark:border-green-800 mb-6 text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 dark:text-green-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xl font-medium text-green-800 dark:text-green-200">Your answer has been submitted!</p>
                                    </div>
                                    
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-300 mb-3 font-medium">Waiting for other players...</p>
                                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-in-out" 
                                                style={{ width: `${(answersSubmitted / totalAnswersNeeded) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
                                            {answersSubmitted} of {totalAnswersNeeded} answers received
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold mb-5 text-center text-slate-800 dark:text-slate-200">All Answers:</h2>
                                    <ul className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 fancy-scrollbar">
                                        {allAnswers.map((answer, index) => (
                                            <li 
                                                key={index} 
                                                className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md transition"
                                            >
                                                <p className="font-medium text-slate-800 dark:text-slate-200">{answer.answer}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">- {answer.playerName}</p>
                                            </li>
                                        ))}
                                    </ul>

                                    {isHost && (
                                        <button
                                            onClick={handleNextRound}
                                            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg flex items-center justify-center transition duration-300"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                            Start Next Round
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">Players</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {players.map((player) => (
                                        <div key={player.id} className="bg-white dark:bg-slate-700 p-3 rounded-lg text-center shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md transition">
                                            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{player.name}</div>
                                            {player.isHost && (
                                                <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded-full">Host</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
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

    return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <header className="p-6 sm:p-8">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <Link href="/" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline flex items-center transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Home
                    </Link>
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
                    <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-slate-800 dark:text-slate-100">
                        {mode === 'create' ? 'Create a New Lobby' : 'Join Existing Lobby'}
                    </h1>

                    {!isInLobby ? (
                        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                            {error && (
                                <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
                                    {error}
                                </div>
                            )}
                            
                            <form onSubmit={mode === 'create' ? handleCreateLobby : handleJoinLobby} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300" htmlFor="username">
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

                                {mode === 'join' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300" htmlFor="lobbyCode">
                                            Lobby Code
                                        </label>
                                        <input
                                            type="text"
                                            id="lobbyCode"
                                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition tracking-wider text-center font-mono uppercase"
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
                                    className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg shadow-md flex items-center justify-center transition duration-300 ${
                                        isConnected 
                                            ? 'hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg' 
                                            : 'opacity-60 cursor-not-allowed'
                                    }`}
                                    disabled={!isConnected}
                                >
                                    {mode === 'create' 
                                        ? <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                          </svg> Create Lobby</> 
                                        : <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                            <path fillRule="evenodd" d="M3 14a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                          </svg> Join Lobby</>
                                    }
                                </button>
                                
                                {mode === 'create' ? (
                                    <div className="text-center pt-4">
                                        <Link 
                                            href="?mode=join" 
                                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium hover:underline"
                                        >
                                            Already have a code? Join an existing lobby
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="text-center pt-4">
                                        <Link 
                                            href="?mode=create" 
                                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium hover:underline"
                                        >
                                            Want to host? Create a new lobby
                                        </Link>
                                    </div>
                                )}
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
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

// Export the main component that wraps the lobby content in Suspense
export default function LobbyPage() {
    return (
        <Suspense fallback={
            <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        }>
            <LobbyContent />
        </Suspense>
    );
}