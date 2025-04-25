import React, { useState, useEffect } from 'react';
import SoundButton from './SoundButton';
import { useGameState } from './GameStateProvider';

export function VotingPhase() {
  const {
    answersForVoting,
    userVotes,
    setUserVotes,
    submitVotes,
    hasSubmittedVotes,
    votesSubmitted,
    totalVotesNeeded,
    currentPlayer,
    players,
    error
  } = useGameState();

  // Timer state (default: 60 seconds)
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    // Only run the timer if voting is active
    if (!hasSubmittedVotes && timerActive) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto-submit votes if time runs out and there's at least one vote
            if (userVotes.length > 0 && !hasSubmittedVotes) {
              submitVotes(userVotes);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [hasSubmittedVotes, timerActive, userVotes, submitVotes]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitVotes(userVotes);
  };

  // Filter out the player's own answer
  const otherAnswers = answersForVoting.filter(
    (answer) => answer.answerId !== currentPlayer?.id
  );

  // Find the player ID the user selected for a specific answer
  const getSelectedPlayerIdForAnswer = (answerId: string) => {
    const vote = userVotes.find(v => v.answerId === answerId);
    return vote ? vote.guessedPlayerId : null;
  };

  // Handle player selection for an answer
  const handlePlayerSelection = (answerId: string, playerId: string) => {
    const newVotes = [...userVotes];
    
    // Remove any existing vote for this answer
    const existingVoteIndex = newVotes.findIndex(v => v.answerId === answerId);
    if (existingVoteIndex !== -1) {
      newVotes.splice(existingVoteIndex, 1);
    }

    // Add the new vote
    newVotes.push({
      answerId,
      guessedPlayerId: playerId,
    });

    setUserVotes(newVotes);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">
        Voting Phase
      </h2>
      <p className="text-center mb-2 text-slate-600 dark:text-slate-300">
        Guess who wrote each answer!
      </p>

      {!hasSubmittedVotes && (
        <div className="mb-4 flex justify-center items-center">
          <div className={`text-center py-1 px-4 rounded-full ${
            timeLeft <= 10 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              : timeLeft <= 30
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' 
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      )}

      {!hasSubmittedVotes ? (
        <form onSubmit={handleSubmit}>
          <ul className="space-y-6 mb-6">
            {otherAnswers.map((answer, index) => (
              <li
                key={index}
                className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
              >
                <p className="font-medium text-slate-800 dark:text-slate-200 mb-4">
                  {answer.answer}
                </p>

                <div className="mt-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 block">
                    Who wrote this?
                  </label>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {players
                      .filter((p) => p.id !== currentPlayer?.id)
                      .map((player) => (
                        <button
                          type="button"
                          key={player.id}
                          onClick={() => handlePlayerSelection(answer.answerId, player.id)}
                          className={`px-4 py-2 rounded-md text-sm transition-all ${
                            getSelectedPlayerIdForAnswer(answer.answerId) === player.id
                              ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 dark:ring-indigo-900 font-medium'
                              : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          {player.name}
                        </button>
                      ))}
                  </div>
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
            disabled={userVotes.length !== otherAnswers.length}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 010 1.414l-8 8a1 1 01-1.414 0l-4-4a1 1 011.414-1.414L7.414 9H15a1 1 110 2H7.414l2.293 2.293a1 1 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Submit Votes ({userVotes.length}/{otherAnswers.length})
          </SoundButton>
        </form>
      ) : (
        <div>
          <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg shadow-inner border border-green-100 dark:border-green-800 mb-6 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-green-500 dark:text-green-400 mb-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 000 16zm3.707-9.293a1 1 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xl font-medium text-green-800 dark:text-green-200">
              Your votes have been submitted!
            </p>
          </div>

          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 mb-3 font-medium">
              Waiting for other players to vote...
            </p>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-in-out"
                style={{
                  width: `${(votesSubmitted / totalVotesNeeded) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
              {votesSubmitted} of {totalVotesNeeded} votes received
            </p>
          </div>
        </div>
      )}
    </div>
  );
}