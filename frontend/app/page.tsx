import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <main className="flex flex-col items-center">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-block p-3 sm:p-4 mb-6 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 inline-block text-transparent bg-clip-text">
              Masquerade
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              A social deduction game where identities are hidden and creativity is revealed
            </p>
          </div>
          
          {/* Game Card */}
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl mb-16 overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition duration-300 text-center flex items-center justify-center"
                  href="/lobby?mode=create"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Lobby
                </Link>
                <Link
                  className="flex-1 py-4 px-6 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl shadow-md border border-slate-200 dark:border-slate-600 hover:shadow-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition duration-300 text-center flex items-center justify-center"
                  href="/lobby?mode=join"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Join Lobby
                </Link>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                    <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">?</span>
                    How to Play
                  </h2>
                  <ol className="space-y-4 pl-4">
                    <li className="flex items-start">
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold mt-0.5">1</span>
                      <span className="text-slate-700 dark:text-slate-300">Create a lobby or join using a friend's code</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold mt-0.5">2</span>
                      <span className="text-slate-700 dark:text-slate-300">Everyone responds to the same prompt in a unique style</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold mt-0.5">3</span>
                      <span className="text-slate-700 dark:text-slate-300">Read all responses and try to guess who wrote what</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold mt-0.5">4</span>
                      <span className="text-slate-700 dark:text-slate-300">Score points for correct guesses and successful deception</span>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-5 rounded-xl">
                  <h3 className="font-semibold text-lg mb-2 text-indigo-800 dark:text-indigo-200">Perfect for:</h3>
                  <ul className="grid grid-cols-2 gap-3">
                    <li className="flex items-center text-slate-700 dark:text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Game nights
                    </li>
                    <li className="flex items-center text-slate-700 dark:text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Team building
                    </li>
                    <li className="flex items-center text-slate-700 dark:text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Virtual hangouts
                    </li>
                    <li className="flex items-center text-slate-700 dark:text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Ice breakers
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 text-center">
              <p className="text-white font-medium text-lg sm:text-xl">Ready to play? Join or create a game now!</p>
            </div>
          </div>
        </main>
        
        <footer className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 Masquerade Game | An interactive party game for friends
          </p>
        </footer>
      </div>
    </div>
  );
}
