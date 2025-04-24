"use client";
import { useEffect } from "react";
import { useAudio } from "./components/AudioProvider"; // exact same path
import SoundLink from "./components/SoundLink";
import Image from "next/image";

export default function Home() {
  const { playLobby } = useAudio();

  useEffect(() => {
    playLobby();
  }, [playLobby]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <main className="flex flex-col items-center">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="mb-6 flex justify-center">
              <Image
                src="/images/masquerade-logo1.png"
                alt="Masquerade Logo"
                width={180}
                height={120}
                className="dark:invert"
              />
            </div>
            <p className="font-freakshow text-2xl text-blue-300 text-center mt-2">
              a game where you unmask your friends' true identities
            </p>
          </div>

          {/* Game Card */}
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl mb-16 overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <SoundLink
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition duration-300 text-center flex items-center justify-center"
                  href="/lobby?mode=create"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Create Lobby
                </SoundLink>
                <SoundLink
                  className="flex-1 py-4 px-6 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl shadow-md border border-slate-200 dark:border-slate-600 hover:shadow-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition duration-300 text-center flex items-center justify-center"
                  href="/lobby?mode=join"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Join Lobby
                </SoundLink>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 text-center">
                    How to Play
                  </h2>

                  <ol className="space-y-4 pl-4">
                    <li className="flex items-start">
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold mt-0.5">
                        1
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        Create a lobby or join using a friend's code
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold mt-0.5">
                        2
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        Everyone responds to the same prompt in a unique style
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold mt-0.5">
                        3
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        Read all responses and try to guess who wrote what
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold mt-0.5">
                        4
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        Score points for correct guesses and successful
                        deception
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 text-center">
              <div className="flex justify-center">
                <Image
                  src="/images/masquerade-logo2.png"
                  alt="Masquerade Logo 2"
                  width={180}
                  height={60}
                  className="dark:invert"
                />
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Masquerade Game | Made in CS247G by Gabe Magaña, Mateo Larrea Ferro,
            Karina Chen, and Maimuna Muntaha
          </p>
        </footer>
      </div>
    </div>
  );
}
