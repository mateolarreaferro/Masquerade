import React from 'react';
import SoundButton from './SoundButton';
import { useGameState } from './GameStateProvider';

export function ResultsDisplay() {
  const { 
    allAnswers, 
    currentPlayer, 
    results, 
    players, 
    startNextRound 
  } = useGameState();

  const isHost = currentPlayer?.isHost;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-5 text-center text-slate-800 dark:text-slate-200">
        Round Results
      </h2>

      {/* All answers with authors and voting results */}
      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
        All Answers:
      </h3>
      <ul className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 fancy-scrollbar">
        {allAnswers.map((answer, index) => {
          // Find votes for this answer
          let correctVotes = 0;
          let totalVotes = 0;

          if (results?.votingResults) {
            results.votingResults.forEach(([voterId, votes]) => {
              votes.forEach((vote) => {
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
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800"
                  : "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600"
              }`}
            >
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {answer.answer}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="mr-1">By:</span>
                  <span
                    className={
                      isCurrentPlayerAnswer
                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                        : ""
                    }
                  >
                    {answer.playerName}{" "}
                    {isCurrentPlayerAnswer ? "(You)" : ""}
                  </span>
                </p>

                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">
                  {correctVotes} of {totalVotes} players guessed
                  correctly
                </span>
              </div>

              {/* Show current player's guess for this answer */}
              {!isCurrentPlayerAnswer && results?.votingResults && (
                <div className="mt-2 text-sm">
                  {(() => {
                    // Find this player's vote for this answer
                    const myVotes = results.votingResults.find(
                      ([voterId]) => voterId === currentPlayer?.id
                    )?.[1];
                    const myVote = myVotes?.find(
                      (vote) => vote.answerId === answer.playerId
                    );

                    if (myVote) {
                      const guessedPlayer = players.find(
                        (p) => p.id === myVote.guessedPlayerId
                      );
                      const isCorrect =
                        myVote.guessedPlayerId === answer.playerId;

                      return (
                        <div
                          className={`mt-1 p-2 rounded-md ${
                            isCorrect
                              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800"
                              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"
                          }`}
                        >
                          <span>You guessed: </span>
                          <span className="font-medium">
                            {guessedPlayer?.name}
                          </span>
                          <span className="ml-1">
                            {isCorrect ? "✓" : "✗"}
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
          onClick={startNextRound}
          className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg flex items-center justify-center transition duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 010 1.414l-4 4a1 1 01-1.414-1.414L7.414 9H15a1 1 110 2H7.414l2.293 2.293a1 1 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Start Next Round
        </SoundButton>
      )}
    </div>
  );
}