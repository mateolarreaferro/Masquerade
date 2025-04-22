// filepath: /Users/gdmagana/Developer/Github/Masquerade/frontend/app/lobby/page.js
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import SoundButton from '../components/SoundButton'; 
import SoundLink from '../components/SoundLink'; 

// Define player interface
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score?: number; // Add score for tracking points
}

// Define answer interface
interface Answer {
  playerId: string;
  playerName: string;
  answer: string;
}

// Define answer for voting interface
interface AnswerForVoting {
  answerId: string; // ID of the player who submitted this answer
  answer: string;
}

// Define vote interface
interface Vote {
  answerId: string; // ID of the answer being voted on
  guessedPlayerId: string; // ID of the player who is guessed to have written this
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
    
    // New state for prompt selection phase
    const [isPromptSelectionPhase, setIsPromptSelectionPhase] = useState(false);
    const [isStyleSelectionPhase, setIsStyleSelectionPhase] = useState(false);
    const [promptOptions, setPromptOptions] = useState<string[]>([]);
    const [styleOptions, setStyleOptions] = useState<string[]>([]);
    const [promptSelectingPlayerId, setPromptSelectingPlayerId] = useState<string>('');
    const [styleSelectingPlayerId, setStyleSelectingPlayerId] = useState<string>('');
    const [selectedPrompt, setSelectedPrompt] = useState<string>('');
    const [selectedStyle, setSelectedStyle] = useState<string>('');
    
    // New state for voting phase
    const [isVotingPhase, setIsVotingPhase] = useState(false);
    const [answersForVoting, setAnswersForVoting] = useState<AnswerForVoting[]>([]);
    const [userVotes, setUserVotes] = useState<Vote[]>([]);
    const [hasSubmittedVotes, setHasSubmittedVotes] = useState(false);
    const [votesSubmitted, setVotesSubmitted] = useState(0);
    const [totalVotesNeeded, setTotalVotesNeeded] = useState(0);
    const [isResultsPhase, setIsResultsPhase] = useState(false);
    const [results, setResults] = useState<{
        answers: Answer[],
        scores: {id: string, name: string, score: number}[],
        votingResults: [string, Vote[]][]
    } | null>(null);
    
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
            
            // Detect device type for specific configurations
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Log connection attempt for debugging
            console.log(`Attempting to connect to ${socketUrl} from ${isIOS ? 'iOS' : isMobile ? 'Mobile' : 'Desktop'}`);
            
            // Create Socket.IO instance with optimized configuration
            socketInstance = io(socketUrl, {
                transports: ['websocket', 'polling'], // Try websocket first, then fallback to polling
                forceNew: true,         // Force a new connection attempt
                reconnection: true,
                reconnectionAttempts: 10, // Limit reconnection attempts to prevent excessive retries
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000,         // Shorter timeout to fail faster if connection can't be established
                autoConnect: true,
                path: '/socket.io',
                withCredentials: true,  // Try with credentials enabled
                
                // Set explicit polling configuration to fix XHR errors
                transportOptions: {
                    polling: {
                        extraHeaders: {
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache',
                            'If-None-Match': 'no-match'
                        }
                    }
                },
                
                // Adjust connection parameters for different devices
                ...(isMobile && {
                    pingInterval: 25000, // More frequent pings for mobile
                    pingTimeout: 60000   // Longer ping timeout for mobile
                }),
                ...(isIOS && {
                    extraHeaders: {
                        'Cache-Control': 'no-cache'  // Important for iOS
                    }
                })
            });
            
            // Add all error events for debugging
            socketInstance.on('connect_error', (err) => {
                console.error('Socket.io connect error:', err.message);
                setError(`Connection error: ${err.message}. Attempting to reconnect...`);
                
                // Force reconnect with different transport on error
                if (socketInstance && socketInstance.io) {
                    console.log('Forcing reconnect with polling transport');
                    socketInstance.io.opts.transports = ['polling'];
                    setTimeout(() => socketInstance?.connect(), 1000);
                }
            });
            
            socketInstance.on('connect_timeout', (timeout) => {
                console.error('Socket.io connect timeout:', timeout);
                setError('Connection timed out. Attempting to reconnect...');
            });
            
            socketInstance.on('reconnect_attempt', (attemptNumber) => {
                console.log(`Socket.io reconnect attempt ${attemptNumber}`);
                setError(`Reconnection attempt ${attemptNumber}...`);
                
                // Alternate between transport methods on subsequent reconnect attempts
                if (socketInstance && socketInstance.io) {
                    if (attemptNumber % 2 === 0) {
                        console.log('Trying reconnect with websocket');
                        socketInstance.io.opts.transports = ['websocket'];
                    } else {
                        console.log('Trying reconnect with polling');
                        socketInstance.io.opts.transports = ['polling'];
                    }
                }
            });
            
            socketInstance.on('reconnect_error', (err) => {
                console.error('Socket.io reconnect error:', err);
                setError(`Reconnection error: ${err.message}`);
            });
            
            socketInstance.on('reconnect_failed', () => {
                console.error('Socket.io reconnect failed');
                setError('Reconnection failed. Please refresh the page.');
                
                // Final attempt with long polling only after all reconnect attempts fail
                setTimeout(() => {
                    console.log('Final attempt: Forcing long polling mode');
                    if (socketInstance && socketInstance.io) {
                        socketInstance.io.opts.transportOptions = {
                            polling: {
                                extraHeaders: {
                                    'Cache-Control': 'no-cache',
                                    'Pragma': 'no-cache'
                                }
                            }
                        };
                        socketInstance.connect();
                    }
                }, 2000);
            });
            
            socketInstance.on('error', (err) => {
                console.error('Socket.io general error:', err);
                setError(`Socket error: ${err.message || 'Unknown error'}`);
            });
            
            // Handle transport error specifically for xhr polling error
            // Define interfaces for the socket engine and error types
            interface SocketIOEngineTransportError {
                message?: string;
                description?: string;
                context?: any;
                type?: string;
            }
            
            // Define a minimal EventEmitter interface with just what we need
            interface EventEmitter {
                on(event: string, listener: (...args: any[]) => void): any;
                off(event: string, listener: (...args: any[]) => void): any;
                emit(event: string, ...args: any[]): boolean;
                removeAllListeners(event?: string): any;
            }

            interface SocketIOEngine extends EventEmitter {
                transport: {
                    name: string;
                };
                close: () => void;
            }

            socketInstance.io.engine?.on('transport_error' as any, (err: SocketIOEngineTransportError) => {
                console.error('Transport error:', err);
                setError('Network transport error. Trying alternative connection method...');
                
                // Force a new connection with a different transport
                if (socketInstance && socketInstance.io) {
                    const currentTransport: string = socketInstance.io.engine?.transport.name;
                    console.log(`Current transport ${currentTransport} failed, switching...`);
                    
                    // Switch transport explicitly
                    socketInstance.io.engine?.close();
                    
                    setTimeout(() => {
                        if (socketInstance) {
                            socketInstance.io.opts.transports = [currentTransport === 'polling' ? 'websocket' : 'polling'];
                            socketInstance.connect();
                        }
                    }, 1000);
                }
            });
            
            // Monitor the socket state more carefully
            socketInstance.io.on('reconnect', (attempt) => {
                console.log(`Socket.io reconnected after ${attempt} attempts`);
                setIsConnected(true);
                setError('');
            });
        }
        
        // Store the singleton in our ref
        socketRef.current = socketInstance;
        
        const socket = socketRef.current;
        
        // Handle successful connection
        socket.on('connect', () => {
            console.log('Connected to game server with ID:', socket.id);
            setIsConnected(true);
            setError('');
            
            // Log the transport being used
            console.log('Transport being used:', socket.io.engine?.transport.name);
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from game server');
            setIsConnected(false);
            setError('Disconnected from server. Attempting to reconnect...');
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
        
        socket.on('gameStarted', () => {
            console.log('Game started');
            setIsGameStarted(true);
            // The prompt and style will be set later in the prompt/style selection phases
            setCurrentPrompt('');
            setCurrentAnswerStyle('');
            setHasSubmittedAnswer(false);
            setUserAnswer('');
            setAllAnswers([]);
            setShowAnswers(false);
            setIsVotingPhase(false);
            setIsResultsPhase(false);
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

        // New event listeners for voting phase
        socket.on('startVotingPhase', ({ answers, players }) => {
            console.log('Voting phase started with answers:', answers);
            setIsVotingPhase(true);
            setAnswersForVoting(answers);
            setUserVotes([]);
            setHasSubmittedVotes(false);
            setVotesSubmitted(0);
            setTotalVotesNeeded(players.length);
            setShowAnswers(false);
        });

        socket.on('votingProgress', ({ submitted, total }) => {
            console.log('Vote progress:', submitted, '/', total);
            setVotesSubmitted(submitted);
            setTotalVotesNeeded(total);
        });

        socket.on('revealResults', ({ answers, scores, votingResults }) => {
            console.log('Results revealed:', answers, scores, votingResults);
            setIsResultsPhase(true);
            setIsVotingPhase(false);
            setAllAnswers(answers);
            setResults({
                answers,
                scores,
                votingResults
            });
            
            // Update player scores in the players array too
            setPlayers(prevPlayers => {
                return prevPlayers.map(player => {
                    // Define an interface for player scores
                    interface PlayerScore {
                      id: string;
                      name: string;
                      score: number;
                    }
                    
                    const scoreInfo: PlayerScore | undefined = scores.find((s: PlayerScore) => s.id === player.id);
                    if (scoreInfo) {
                        return { ...player, score: scoreInfo.score };
                    }
                    return player;
                });
            });
            
            setShowAnswers(true);
        });

        // New event listeners for prompt selection phase
        socket.on('startPromptSelection', ({ prompts, playerId }) => {
            console.log('Starting prompt selection with options:', prompts);
            setIsPromptSelectionPhase(true);
            setPromptOptions(prompts);
            setPromptSelectingPlayerId(playerId);
            setSelectedPrompt('');
            
            // Reset other game states to ensure clean UI
            setIsStyleSelectionPhase(false);
            setHasSubmittedAnswer(false);
            setShowAnswers(false);
            setIsVotingPhase(false);
            setIsResultsPhase(false);
        });
        
        socket.on('promptSelected', ({ prompt }) => {
            console.log('Prompt selected:', prompt);
            setSelectedPrompt(prompt);
            setIsPromptSelectionPhase(false);
        });
        
        // New event listeners for style selection phase
        socket.on('startStyleSelection', ({ styles, playerId }) => {
            console.log('Starting style selection with options:', styles);
            setIsStyleSelectionPhase(true);
            setStyleOptions(styles);
            setStyleSelectingPlayerId(playerId);
            setSelectedStyle('');
        });
        
        socket.on('styleSelected', ({ style }) => {
            console.log('Style selected:', style);
            setSelectedStyle(style);
            setIsStyleSelectionPhase(false);
        });
        
        socket.on('roundSetup', ({ prompt, answerStyle }) => {
            console.log('Round setup complete with prompt:', prompt, 'and style:', answerStyle);
            // Update the prompt and style values to display to all players
            setCurrentPrompt(prompt);
            setCurrentAnswerStyle(answerStyle);
            
            // Reset states for the answer submission phase
            setIsPromptSelectionPhase(false);
            setIsStyleSelectionPhase(false);
            setHasSubmittedAnswer(false);
            setUserAnswer('');
            setAllAnswers([]);
            setShowAnswers(false);
            setIsVotingPhase(false);
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
            socket.off('startVotingPhase');
            socket.off('votingProgress');
            socket.off('revealResults');
            socket.off('startPromptSelection');
            socket.off('promptSelected');
            socket.off('startStyleSelection');
            socket.off('styleSelected');
            socket.off('roundSetup');
            // We're not disconnecting the socket here to allow persistence between page navigations
            
            // Add cleanup for engine-level listeners too
            socket.io.engine?.removeAllListeners('transport_error' as any);
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
            setIsVotingPhase(false);
            setAnswersForVoting([]);
            setUserVotes([]);
            setHasSubmittedVotes(false);
            setVotesSubmitted(0);
            setTotalVotesNeeded(0);
            setIsResultsPhase(false);
            setResults(null);
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

    // Interface for the data sent when submitting votes
    interface SubmitVotesPayload {
        votes: Vote[];
    }

    const handleSubmitVotes = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Get all answers except the player's own
        const otherAnswers = answersForVoting.filter(answer => answer.answerId !== currentPlayer?.id);
        
        // Check if votes are complete
        if (userVotes.length !== otherAnswers.length) {
            setError('Please select a player for each answer');
            return;
        }
        
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('submitVotes', { votes: userVotes });
            setHasSubmittedVotes(true); // Mark votes as submitted immediately
            setError(''); // Clear any error
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
                        <SoundLink href="/" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline flex items-center transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 14.707a1 1 01-1.414 0l-4-4a1 1 010-1.414l4-4a1 1 011.414 1.414L7.414 9H15a1 1 110 2H7.414l2.293 2.293a1 1 010 1.414z" clipRule="evenodd" />
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
                        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-slate-800 dark:text-slate-100">Game in Progress</h1>
                        
                        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                            
                            {/* Prompt Selection Phase */}
                            {isPromptSelectionPhase && (
                                <div className="mb-8 space-y-4">
                                    <h2 className="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">
                                        {promptSelectingPlayerId === currentPlayer?.id ? 
                                            "Choose a Prompt" : 
                                            `${players.find(p => p.id === promptSelectingPlayerId)?.name} is choosing a prompt...`}
                                    </h2>
                                    
                                    {promptSelectingPlayerId === currentPlayer?.id ? (
                                        <div className="space-y-3">
                                            <p className="text-center mb-4 text-slate-600 dark:text-slate-300">
                                                Select one of the prompts below:
                                            </p>
                                            {promptOptions.map((prompt, index) => (
                                                <SoundButton
                                                    key={index}
                                                    className={`w-full p-4 text-left text-lg rounded-lg border transition-all ${
                                                        selectedPrompt === prompt 
                                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 border-blue-300 dark:border-blue-700 shadow-md'
                                                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                                    }`}
                                                    onClick={() => setSelectedPrompt(prompt)}
                                                >
                                                    {prompt}
                                                </SoundButton>
                                            ))}
                                            
                                            {selectedPrompt && (
                                                <SoundButton
                                                    className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center justify-center"
                                                    onClick={() => {
                                                        if (socketRef.current && socketRef.current.connected) {
                                                            socketRef.current.emit('selectPrompt', { prompt: selectedPrompt });
                                                        }
                                                    }}
                                                >
                                                    Confirm Selection
                                                </SoundButton>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="flex justify-center mb-4">
                                                <div className="animate-pulse w-16 h-16 text-indigo-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 012 2v6a2 2 01-2 2H5a2 2 01-2-2v-6a2 2 012-2m14 0V9a2 2 00-2-2M5 11V9a2 2 00-2-2m0 0V5a2 2 012-2h6a2 2 012 2v2M7 7h10" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300">Please wait while they choose...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Style Selection Phase */}
                            {isStyleSelectionPhase && (
                                <div className="mb-8 space-y-4">
                                    <h2 className="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">
                                        {styleSelectingPlayerId === currentPlayer?.id ? 
                                            "Choose an Answer Style" : 
                                            `${players.find(p => p.id === styleSelectingPlayerId)?.name} is choosing an answer style...`}
                                    </h2>
                                    
                                    {styleSelectingPlayerId === currentPlayer?.id ? (
                                        <div className="space-y-3">
                                            <p className="text-center mb-4 text-slate-600 dark:text-slate-300">
                                                Select one of the answer styles below:
                                            </p>
                                            {styleOptions.map((style, index) => (
                                                <SoundButton
                                                    key={index}
                                                    className={`w-full p-4 text-left text-lg rounded-lg border transition-all ${
                                                        selectedStyle === style 
                                                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 border-purple-300 dark:border-purple-700 shadow-md'
                                                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                                    }`}
                                                    onClick={() => setSelectedStyle(style)}
                                                >
                                                    {style}
                                                </SoundButton>
                                            ))}
                                            
                                            {selectedStyle && (
                                                <SoundButton
                                                    className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center justify-center"
                                                    onClick={() => {
                                                        if (socketRef.current && socketRef.current.connected) {
                                                            socketRef.current.emit('selectStyle', { style: selectedStyle });
                                                        }
                                                    }}
                                                >
                                                    Confirm Selection
                                                </SoundButton>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="flex justify-center mb-4">
                                                <div className="animate-pulse w-16 h-16 text-purple-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300">Please wait while they choose an answer style...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Prompt and Answer Style Display */}
                            {!isPromptSelectionPhase && !isStyleSelectionPhase && (
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
                            )}

                            {/* Answer Submission Form */}
                            {!isPromptSelectionPhase && !isStyleSelectionPhase && !hasSubmittedAnswer && !showAnswers && !isVotingPhase ? (
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
                                    
                                    <SoundButton
                                        type="submit"
                                        className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center justify-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 010 1.414l-8 8a1 1 01-1.414 0l-4-4a1 1 011.414-1.414L7.414 9H15a1 1 110 2H7.414l2.293 2.293a1 1 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                        Submit Answer
                                    </SoundButton>
                                </form>
                            ) : !isPromptSelectionPhase && !isStyleSelectionPhase && !showAnswers && !isVotingPhase ? (
                                <div className="mb-8">
                                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg shadow-inner border border-green-100 dark:border-green-800 mb-6 text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 dark:text-green-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 000 16zm3.707-9.293a1 1 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clipRule="evenodd" />
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
                            ) : isVotingPhase ? (
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">Voting Phase</h2>
                                    <p className="text-center mb-6 text-slate-600 dark:text-slate-300">Guess who wrote each answer!</p>
                                    
                                    {!hasSubmittedVotes ? (
                                        <form onSubmit={handleSubmitVotes}>
                                            <ul className="space-y-4 mb-6">
                                                {answersForVoting
                                                  .filter(answer => answer.answerId !== currentPlayer?.id) // Filter out player's own answer
                                                  .map((answer, index) => (
                                                    <li key={index} className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
                                                        <p className="font-medium text-slate-800 dark:text-slate-200 mb-3">{answer.answer}</p>
                                                        
                                                        <div className="mt-2">
                                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Who wrote this?</label>
                                                            <select 
                                                                className="w-full mt-1 p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500"
                                                                onChange={(e) => {
                                                                    const newVotes = [...userVotes];
                                                                    // Remove any existing vote for this answer
                                                                    const existingVoteIndex = newVotes.findIndex(v => v.answerId === answer.answerId);
                                                                    if (existingVoteIndex !== -1) {
                                                                        newVotes.splice(existingVoteIndex, 1);
                                                                    }
                                                                    
                                                                    // Add the new vote if a player was selected
                                                                    if (e.target.value) {
                                                                        newVotes.push({
                                                                            answerId: answer.answerId,
                                                                            guessedPlayerId: e.target.value
                                                                        });
                                                                    }
                                                                    
                                                                    setUserVotes(newVotes);
                                                                }}
                                                                required
                                                            >
                                                                <option value="">Select a player</option>
                                                                {players.filter(p => p.id !== currentPlayer?.id).map((player) => (
                                                                    <option key={player.id} value={player.id}>{player.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                            
                                            {error && (
                                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
                                                    {error}
                                                </div>
                                            )}
                                            
                                            <SoundButton
                                                type="submit"
                                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300 flex items-center justify-center"
                                                disabled={userVotes.length !== answersForVoting.filter(a => a.answerId !== currentPlayer?.id).length} // Only count other players' answers
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 010 1.414l-8 8a1 1 01-1.414 0l-4-4a1 1 011.414-1.414L7.414 9H15a1 1 110 2H7.414l2.293 2.293a1 1 010 1.414z" clipRule="evenodd" />
                                                </svg>
                                                Submit Votes ({userVotes.length}/{answersForVoting.filter(a => a.answerId !== currentPlayer?.id).length})
                                            </SoundButton>
                                        </form>
                                    ) : (
                                        <div>
                                            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg shadow-inner border border-green-100 dark:border-green-800 mb-6 text-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 dark:text-green-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 000 16zm3.707-9.293a1 1 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-xl font-medium text-green-800 dark:text-green-200">Your votes have been submitted!</p>
                                            </div>
                                            
                                            <div className="text-center">
                                                <p className="text-slate-600 dark:text-slate-300 mb-3 font-medium">Waiting for other players to vote...</p>
                                                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-in-out" 
                                                        style={{ width: `${(votesSubmitted / totalVotesNeeded) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
                                                    {votesSubmitted} of {totalVotesNeeded} votes received
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : showAnswers && (
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold mb-5 text-center text-slate-800 dark:text-slate-200">Round Results</h2>
                                    
                                    {/* All answers with authors and voting results */}
                                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">All Answers:</h3>
                                    <ul className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 fancy-scrollbar">
                                        {allAnswers.map((answer, index) => {
                                            // Find votes for this answer
                                            let correctVotes = 0;
                                            let totalVotes = 0;
                                            
                                            if (results?.votingResults) {
                                                results.votingResults.forEach(([voterId, votes]) => {
                                                    votes.forEach(vote => {
                                                        if (vote.answerId === answer.playerId) {
                                                            totalVotes++;
                                                            if (vote.guessedPlayerId === answer.playerId) {
                                                                correctVotes++;
                                                            }
                                                        }
                                                    });
                                                });
                                            }
                                            
                                            // Highlight the current player's answer
                                            const isCurrentPlayerAnswer = answer.playerId === currentPlayer?.id;
                                            
                                            return (
                                                <li 
                                                    key={index} 
                                                    className={`p-4 rounded-lg shadow-sm border hover:shadow-md transition ${
                                                        isCurrentPlayerAnswer 
                                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800' 
                                                            : 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600'
                                                    }`}
                                                >
                                                    <p className="font-medium text-slate-800 dark:text-slate-200">{answer.answer}</p>
                                                    <div className="mt-2 flex flex-wrap items-center justify-between">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            <span className="mr-1">By:</span>
                                                            <span className={isCurrentPlayerAnswer ? "text-blue-600 dark:text-blue-400 font-semibold" : ""}>
                                                                {answer.playerName} {isCurrentPlayerAnswer ? "(You)" : ""}
                                                            </span>
                                                        </p>
                                                        
                                                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">
                                                            {correctVotes} of {totalVotes} players guessed correctly
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Show current player's guess for this answer */}
                                                    {!isCurrentPlayerAnswer && results?.votingResults && (
                                                        <div className="mt-2 text-sm">
                                                            {(() => {
                                                                // Find this player's vote for this answer
                                                                const myVotes = results.votingResults.find(([voterId]) => voterId === currentPlayer?.id)?.[1];
                                                                const myVote = myVotes?.find(vote => vote.answerId === answer.playerId);
                                                                
                                                                if (myVote) {
                                                                    const guessedPlayer = players.find(p => p.id === myVote.guessedPlayerId);
                                                                    const isCorrect = myVote.guessedPlayerId === answer.playerId;
                                                                    
                                                                    return (
                                                                        <div className={`mt-1 p-2 rounded-md ${
                                                                            isCorrect 
                                                                                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800' 
                                                                                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800'
                                                                        }`}>
                                                                            <span>You guessed: </span>
                                                                            <span className="font-medium">{guessedPlayer?.name}</span>
                                                                            <span className="ml-1">
                                                                                {isCorrect ? '✓' : '✗'}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {isHost && (
                                        <SoundButton
                                            onClick={handleNextRound}
                                            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg flex items-center justify-center transition duration-300"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 010 1.414l-4 4a1 1 01-1.414-1.414L7.414 9H15a1 1 110 2H7.414l2.293 2.293a1 1 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                            Start Next Round
                                        </SoundButton>
                                    )}
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">Players</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {/* Sort players by score, highest first */}
                                    {players
                                        .slice()
                                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                                        .map((player) => (
                                            <div key={player.id} className="bg-white dark:bg-slate-700 p-3 rounded-lg text-center shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md transition">
                                                <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{player.name}</div>
                                                <div className="flex items-center justify-center gap-2 mt-1">
                                                    {player.isHost && (
                                                        <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded-full">Host</span>
                                                    )}
                                                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{player.score || 0}</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                                {/* Remove the duplicate scores section that was here before */}
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
                    <SoundLink href="/" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline flex items-center transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 14.707a1 1 01-1.414 0l-4-4a1 1 010-1.414l4-4a1 1 011.414 1.414L7.414 9H15a1 1 110 2H7.414l2.293 2.293a1 1 010 1.414z" clipRule="evenodd" />
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
                    <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-slate-800 dark:text-slate-100">
                        {mode === 'create' ? 'Create a New Lobby' : 'Join Existing Lobby'}
                    </h1>

                    {!isInLobby ? (
                        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                            {error && (
                                <div className={`mb-5 p-4 border rounded-lg ${
                                    error.includes('can only join between rounds') 
                                    ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' 
                                    : 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                                }`}>
                                    {error.includes('can only join between rounds') ? (
                                        <>
                                            <h3 className="font-medium mb-1">Game in Progress</h3>
                                            <p>You can join this game when the current round finishes and players are selecting a new prompt.</p>
                                            <p className="text-sm mt-2">Try again in a moment!</p>
                                        </>
                                    ) : (
                                        error
                                    )}
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
                                            maxLength={4}
                                            required
                                        />
                                    </div>
                                )}

                                <SoundButton
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
                                            <path fillRule="evenodd" d="M10 3a1 1 011 1v5h5a1 1 110 2h-5v5a1 1 11-2 0v-5H4a1 1 110-2h5V4a1 1 011-1z" clipRule="evenodd" />
                                          </svg> Create Lobby</> 
                                        : <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 8a1 1 011-1h12a1 1 110 2H4a1 1 01-1-1z" clipRule="evenodd" />
                                            <path fillRule="evenodd" d="M3 14a1 1 011-1h12a1 1 110 2H4a1 1 01-1-1z" clipRule="evenodd" />
                                          </svg> Join Lobby</>
                                    }
                                </SoundButton>
                                
                                <div className="mt-2 text-sm text-center text-slate-600 dark:text-slate-400">
                                    <p>You can now join games that are in between rounds!</p>
                                </div>
                                
                                {mode === 'create' ? (
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
                                <SoundButton
                                    className={`w-full py-2 px-4 font-medium rounded-md transition duration-300 ${
                                        players.length < 2 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                    onClick={handleStartGame}
                                    disabled={players.length < 2}
                                >
                                    {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
                                </SoundButton>
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