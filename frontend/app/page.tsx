import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Masquerade</h1>
          <p className="text-xl mb-8">A social deduction game where identities are hidden</p>
        </div>
        
        <div className="flex gap-6 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-base h-12 px-8 sm:w-auto"
            href="/lobby?mode=create"
          >
            Create Lobby
          </Link>
          <Link
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-base h-12 px-8 w-full sm:w-auto"
            href="/lobby?mode=join"
          >
            Join Lobby
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold mb-4">How to Play</h2>
          <ol className="list-inside list-decimal text-sm/6 text-left max-w-md mx-auto">
            <li className="mb-2 tracking-[-.01em]">
              Create a lobby or join an existing one
            </li>
            <li className="mb-2 tracking-[-.01em]">
              Players respond to prompts in secret
            </li>
            <li className="mb-2 tracking-[-.01em]">
              Everyone votes on whose response is whose
            </li>
            <li className="tracking-[-.01em]">
              Points are awarded based on correct guesses
            </li>
          </ol>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p className="text-sm text-gray-500">© 2025 Masquerade Game</p>
      </footer>
    </div>
  );
}
