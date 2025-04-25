import React from 'react';
import { useGameState } from './GameStateProvider';

export function AnswerSubmission() {
  const { 
    currentPrompt,
    currentAnswerStyle,
    userAnswer,
    setUserAnswer,
    submitAnswer,
    hasSubmittedAnswer,
    answersSubmitted,
    totalAnswersNeeded,
    error
  } = useGameState();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitAnswer(userAnswer);
  };

  // Display current prompt and answer style
  const PromptDisplay = () => (
    <div className="mb-8 space-y-4">
      <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 p-5 sm:p-6 rounded-xl shadow-inner border border-blue-100 dark:border-blue-800">
        <h2 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-300">
          Prompt:
        </h2>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {currentPrompt}
        </p>
      </div>

      <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 p-4 sm:p-5 rounded-xl shadow-inner border border-purple-100 dark:border-purple-800">
        <h3 className="text-md font-medium mb-1 text-purple-800 dark:text-purple-300">
          Answer Style:
        </h3>
        <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
          {currentAnswerStyle}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <PromptDisplay />
      <p className="text-center mb-6 text-slate-600 dark:text-slate-300">
        Write something funny, clever, or just YOU, based on the prompt above. Your answer will be revealed to other players, and they will have to guess who wrote it!
      </p>
      
      {!hasSubmittedAnswer ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300"
              htmlFor="userAnswer"
            >
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
            Submit Answer
          </button>
        </form>
      ) : (
        <div className="mb-8">
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
              Your answer has been submitted!
            </p>
          </div>

          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 mb-3 font-medium">
              Waiting for other players...
            </p>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-in-out"
                style={{
                  width: `${(answersSubmitted / totalAnswersNeeded) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
              {answersSubmitted} of {totalAnswersNeeded} answers received
            </p>
          </div>
        </div>
      )}
    </>
  );
}