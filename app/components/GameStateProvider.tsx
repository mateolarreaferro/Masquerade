import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSocket } from './SocketProvider';
import useSound from 'use-sound';

// Define interfaces for game state
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score?: number;
}

export interface Answer {
  playerId: string;
  playerName: string;
  answer: string;
}

export interface AnswerForVoting {
  answerId: string;
  answer: string;
}

export interface Vote {
  answerId: string;
  guessedPlayerId: string;
}

export interface GameResults {
  answers: Answer[];
  scores: { id: string; name: string; score: number }[];
  votingResults: [string, Vote[]][];
}

interface GameStateContextType {
  // Lobby state
  lobbyCode: string;
  players: Player[];
  isInLobby: boolean;
  isGameStarted: boolean;
  currentPlayer: Player | null;
  error: string;
  
  // Game phase state
  isPromptSelectionPhase: boolean;
  isStyleSelectionPhase: boolean;
  isVotingPhase: boolean;
  isResultsPhase: boolean;
  
  // Game content state
  promptOptions: string[];
  styleOptions: string[];
  promptSelectingPlayerId: string;
  styleSelectingPlayerId: string;
  selectedPrompt: string;
  selectedStyle: string;
  currentPrompt: string;
  currentAnswerStyle: string;
  
  // Player interaction state
  userAnswer: string;
  hasSubmittedAnswer: boolean;
  allAnswers: Answer[];
  answersSubmitted: number;
  totalAnswersNeeded: number;
  answersForVoting: AnswerForVoting[];
  userVotes: Vote[];
  hasSubmittedVotes: boolean;
  votesSubmitted: number;
  totalVotesNeeded: number;
  results: GameResults | null;
  showAnswers: boolean;
  
  // Action handlers
  createLobby: (username: string) => void;
  joinLobby: (username: string, code: string) => void;
  startGame: () => void;
  selectPrompt: (prompt: string) => void;
  selectStyle: (style: string) => void;
  submitAnswer: (answer: string) => void;
  submitVotes: (votes: Vote[]) => void;
  startNextRound: () => void;
  setUserAnswer: (answer: string) => void;
  setUserVotes: (votes: Vote[]) => void;
  resetError: () => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const { socket, error: socketError } = useSocket();
  
  // Lobby state
  const [lobbyCode, setLobbyCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isInLobby, setIsInLobby] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState('');
  
  // Game phase state
  const [isPromptSelectionPhase, setIsPromptSelectionPhase] = useState(false);
  const [isStyleSelectionPhase, setIsStyleSelectionPhase] = useState(false);
  const [isVotingPhase, setIsVotingPhase] = useState(false);
  const [isResultsPhase, setIsResultsPhase] = useState(false);
  
  // Game content state
  const [promptOptions, setPromptOptions] = useState<string[]>([]);
  const [styleOptions, setStyleOptions] = useState<string[]>([]);
  const [promptSelectingPlayerId, setPromptSelectingPlayerId] = useState('');
  const [styleSelectingPlayerId, setStyleSelectingPlayerId] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentAnswerStyle, setCurrentAnswerStyle] = useState('');
  
  // Player interaction state
  const [userAnswer, setUserAnswer] = useState('');
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
  const [answersSubmitted, setAnswersSubmitted] = useState(0);
  const [totalAnswersNeeded, setTotalAnswersNeeded] = useState(0);
  const [answersForVoting, setAnswersForVoting] = useState<AnswerForVoting[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [hasSubmittedVotes, setHasSubmittedVotes] = useState(false);
  const [votesSubmitted, setVotesSubmitted] = useState(0);
  const [totalVotesNeeded, setTotalVotesNeeded] = useState(0);
  const [results, setResults] = useState<GameResults | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  
  const [playCompletedSound] = useSound('/audio/Completed.wav');

  // Set socket error to our error state
  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  // Set up event listeners when socket changes
  useEffect(() => {
    if (!socket) return;

    // Lobby events
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

    // Game state events
    socket.on('gameStarted', () => {
      console.log('Game started');
      setIsGameStarted(true);
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

    // Voting phase events
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
        votingResults,
      });

      // Update player scores in the players array too
      setPlayers((prevPlayers) => {
        return prevPlayers.map((player) => {
          interface ScoreEntry {
            id: string;
            name: string;
            score: number;
          }
          const scoreInfo: ScoreEntry | undefined = scores.find((s: ScoreEntry) => s.id === player.id);
          if (scoreInfo) {
            return { ...player, score: scoreInfo.score };
          }
          return player;
        });
      });

      setShowAnswers(true);
    });

    // Prompt/Style selection events
    socket.on('startPromptSelection', ({ prompts, playerId }) => {
      console.log('Starting prompt selection with options:', prompts);
      setIsPromptSelectionPhase(true);
      setPromptOptions(prompts);
      setPromptSelectingPlayerId(playerId);
      setSelectedPrompt('');

      // Reset other game states
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
      setCurrentPrompt(prompt);
      setCurrentAnswerStyle(answerStyle);

      // Reset states for answer submission
      setIsPromptSelectionPhase(false);
      setIsStyleSelectionPhase(false);
      setHasSubmittedAnswer(false);
      setUserAnswer('');
      setAllAnswers([]);
      setShowAnswers(false);
      setIsVotingPhase(false);
    });

    return () => {
      // Clean up event listeners
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
    };
  }, [socket]);

  // Reset state when unmounting
  useEffect(() => {
    return () => {
      resetGameState();
    };
  }, []);

  // Action handlers
  const resetGameState = () => {
    setLobbyCode('');
    setPlayers([]);
    setIsInLobby(false);
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

  const createLobby = (username: string) => {
    if (!socket) {
      setError('Not connected to game server');
      return;
    }
    
    if (username.trim().length === 0) {
      setError('Please enter your name');
      return;
    }

    console.log('Creating lobby with username:', username);
    socket.emit('createLobby', { username });
  };

  const joinLobby = (username: string, code: string) => {
    if (!socket) {
      setError('Not connected to game server');
      return;
    }
    
    if (username.trim().length === 0) {
      setError('Please enter your name');
      return;
    }

    if (code.trim().length === 0) {
      setError('Please enter a lobby code');
      return;
    }

    console.log('Joining lobby:', code, 'with username:', username);
    socket.emit('joinLobby', {
      username,
      lobbyCode: code.toUpperCase(),
    });
  };

  const startGame = () => {
    if (!socket) {
      setError('Not connected to game server');
      return;
    }
    socket.emit('startGame');
  };

  const selectPrompt = (prompt: string) => {
    if (!socket) {
      setError('Not connected to game server');
      return;
    }
    socket.emit('selectPrompt', { prompt });
  };

  const selectStyle = (style: string) => {
    if (!socket) {
      setError('Not connected to game server');
      return;
    }
    socket.emit('selectStyle', { style });
  };

  const submitAnswer = (answer: string) => {
    if (!socket) {
      setError('Not connected to game server');
      return;
    }
    
    if (answer.trim().length === 0) {
      setError('Please enter your answer');
      return;
    }

    socket.emit('submitAnswer', { answer });
  };

  const submitVotes = (votes: Vote[]) => {
    if (!socket) {
      setError('Not connected to game server');
      return;
    }

    // Get all answers except the player's own
    const otherAnswers = answersForVoting.filter(
      (answer) => answer.answerId !== currentPlayer?.id
    );

    // Check if votes are complete
    if (votes.length !== otherAnswers.length) {
      setError('Please select a player for each answer');
      return;
    }

    socket.emit('submitVotes', { votes });
    playCompletedSound();
    setHasSubmittedVotes(true);
    setError('');
  };

  const startNextRound = () => {
    if (!socket) {
      setError('Not connected to game server');
      return;
    }
    socket.emit('newRound');
  };

  const resetError = () => setError('');

  const value = {
    // Lobby state
    lobbyCode,
    players,
    isInLobby,
    isGameStarted,
    currentPlayer,
    error,
    
    // Game phase state
    isPromptSelectionPhase,
    isStyleSelectionPhase,
    isVotingPhase,
    isResultsPhase,
    
    // Game content state
    promptOptions,
    styleOptions,
    promptSelectingPlayerId,
    styleSelectingPlayerId,
    selectedPrompt,
    selectedStyle,
    currentPrompt,
    currentAnswerStyle,
    
    // Player interaction state
    userAnswer,
    hasSubmittedAnswer,
    allAnswers,
    answersSubmitted,
    totalAnswersNeeded,
    answersForVoting,
    userVotes,
    hasSubmittedVotes,
    votesSubmitted,
    totalVotesNeeded,
    results,
    showAnswers,
    
    // Action handlers
    createLobby,
    joinLobby,
    startGame,
    selectPrompt,
    selectStyle,
    submitAnswer,
    submitVotes,
    startNextRound,
    setUserAnswer,
    setUserVotes,
    resetError
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

// Custom hook to use the game state context
export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};