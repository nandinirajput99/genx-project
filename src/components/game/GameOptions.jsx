import { useNavigate } from "react-router-dom";

function GameOptions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden relative font-sans select-none">
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-380px bg-purple-600/20 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-280px bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Floating 3D Question mark decorative tiles */}
      <div className="hidden lg:flex absolute left-12 top-1/4 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] -rotate-12 animate-pulse">
        ?
      </div>
      <div className="hidden lg:flex absolute right-12 top-1/3 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] rotate-12 animate-pulse">
        ?
      </div>

      {/* Hero Logo Section */}
      <div className="relative flex flex-col items-center mt-2 mb-8 z-10 text-center">
        {/* Mascot Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-b from-indigo-600 via-purple-800 to-purple-950 border-2 border-purple-400/70 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] relative mb-3 group hover:scale-105 transition-transform duration-300">
          <span className="text-4xl sm:text-5xl drop-shadow-md">🦉</span>
          <span className="absolute -top-2 -right-1 text-xl animate-pulse">💡</span>
          <span className="absolute -top-3 -left-1 text-lg">🎓</span>
        </div>

        {/* Project Title & Subtitle */}
        <h1
          className="text-3xl sm:text-5xl font-black tracking-wider uppercase bg-linear-to-b from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]"
          style={{
            textShadow: "0 2px 0 #b45309, 0 4px 0 #78350f, 0 6px 12px rgba(0,0,0,0.8)",
          }}
        >
          KWIZZ
        </h1>
        <p className="text-purple-200/80 text-xs sm:text-sm font-semibold tracking-wide mt-2">
          Challenge your friends and test your knowledge!
        </p>
      </div>

      {/* Game Mode Cards Container */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 z-10">
        
        {/* Join a Game Card */}
        <div className="bg-[#120a2e]/90 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(147,51,234,0.3)] backdrop-blur-xl flex flex-col justify-between items-center text-center group hover:border-purple-400 hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-purple-700 to-indigo-900 border border-purple-400/60 flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
              🎮
            </div>

            <h2 className="text-2xl font-black text-white tracking-wide mb-2">
              Join a Game
            </h2>

            <p className="text-purple-200/70 text-xs sm:text-sm font-medium leading-relaxed mb-6">
              Enter a game code and join your friend&apos;s game.
            </p>
          </div>

          <button
            onClick={() => navigate("/player/join")}
            className="w-full bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black py-4 px-6 rounded-2xl shadow-[0_0_25px_rgba(250,204,21,0.5)] text-base sm:text-lg tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer"
          >
            <span>⚡</span>
            <span>Join Game</span>
            <span className="text-xl">➔</span>
          </button>
        </div>

        {/* Host a Game Card */}
        <div className="bg-[#120a2e]/90 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(147,51,234,0.3)] backdrop-blur-xl flex flex-col justify-between items-center text-center group hover:border-purple-400 hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-indigo-700 to-purple-900 border border-purple-400/60 flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
              🏆
            </div>

            <h2 className="text-2xl font-black text-white tracking-wide mb-2">
              Host a Game
            </h2>

            <p className="text-purple-200/70 text-xs sm:text-sm font-medium leading-relaxed mb-6">
              Create a game and invite another player.
            </p>
          </div>

          <button
            onClick={() => navigate("/host/create")}
            className="w-full bg-linear-to-r from-purple-500 via-indigo-600 to-purple-700 hover:from-purple-400 hover:to-indigo-500 active:scale-[0.98] text-white font-black py-4 px-6 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.5)] text-base sm:text-lg tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer border border-purple-300/40"
          >
            <span>🚀</span>
            <span>Host a Game</span>
            <span className="text-xl">➔</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default GameOptions;
