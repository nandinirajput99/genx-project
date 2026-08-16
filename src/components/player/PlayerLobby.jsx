import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
function PlayerLobby() {
  const navigate = useNavigate();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);

  const [gameData, setGameData] = useState(null);

  const pin = game?.pin || localStorage.getItem("gamePin");

  useEffect(() => {
    if (!pin) {
      navigate("/");
      return;
    }

    const gameRef = doc(db, "games", pin);

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          navigate("/");
          return;
        }

        const data = snapshot.data();

        setGameData(data);

        // Host has started the game
        if (data.status === "playing") {
          navigate("/player/game");
        }
      },
      (error) => {
        console.log("Lobby error:", error);
      }
    );

    return () => unsubscribe();
  }, [pin, navigate]);

  if (!gameData) {
    return (
      <div className="min-h-screen bg-[#0b071e] text-white flex items-center justify-center p-4 font-sans select-none">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-b from-indigo-600 to-purple-900 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse">
            ⏳
          </div>
          <p className="text-purple-300 font-medium tracking-wide animate-pulse">
            Loading Quiz Lobby...
          </p>
        </div>
      </div>
    );
  }

  const avatars = ["🦉", "🎮", "🚀", "👑", "⭐", "🔥", "🎯", "⚡"];

  return (
    <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden relative font-sans select-none">
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-380px bg-purple-600/20 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-280px bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Floating 3D Question mark decorative tiles (Desktop) */}
      <div className="hidden lg:flex absolute left-12 top-1/4 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] -rotate-12 animate-pulse">
        ?
      </div>
      <div className="hidden lg:flex absolute right-12 top-1/3 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] rotate-12 animate-pulse">
        ?
      </div>

      {/* Language Selector Header Button (Top Right) */}
      <div className="w-full flex justify-end max-w-5xl z-20">
        <button
          type="button"
          className="flex items-center space-x-1.5 bg-[#1a1438]/80 border border-purple-500/30 text-purple-200 text-xs sm:text-sm px-3.5 py-1.5 rounded-full backdrop-blur-md hover:bg-purple-900/40 transition cursor-pointer shadow-lg"
        >
          <span>🌐</span>
          <span className="font-medium">English</span>
          <span className="text-[10px]">▼</span>
        </button>
      </div>

      {/* Hero Logo Section */}
      <div className="relative flex flex-col items-center mt-1 sm:mt-3 z-10">
        {/* Floating Speech Bubbles */}
        <div className="absolute -left-28 sm:-left-36 top-1 bg-[#1b103e]/90 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-bounce hidden sm:flex items-center gap-1">
          <span>Game PIN Below 👇</span>
        </div>
        <div className="absolute -right-28 sm:-right-36 top-1 bg-[#1b103e]/90 border border-purple-500/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-bounce hidden sm:flex items-center gap-1">
          <span>👑 Get Ready Champion!</span>
        </div>

        {/* Mascot Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-b from-indigo-600 via-purple-800 to-purple-950 border-2 border-purple-400/70 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] relative mb-2 group hover:scale-105 transition-transform duration-300">
          <span className="text-4xl sm:text-5xl drop-shadow-md">🦉</span>
          <span className="absolute -top-2 -right-1 text-xl animate-pulse">⏳</span>
          <span className="absolute -top-3 -left-1 text-lg">🎓</span>
        </div>

        {/* 3D Game Logo Text */}
        <div className="text-center">
          <h1
            className="text-3xl sm:text-5xl font-black tracking-wider uppercase bg-linear-to-b from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]"
            style={{
              textShadow: "0 2px 0 #b45309, 0 4px 0 #78350f, 0 6px 12px rgba(0,0,0,0.8)",
            }}
          >
            PLAYER LOBBY
          </h1>
          <div className="mt-1 inline-block bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs sm:text-sm px-4 py-0.5 rounded-full font-bold uppercase tracking-widest shadow-md">
            Quiz Arena
          </div>
        </div>
      </div>

      {/* Main Content Area with Side Badges & Central Card */}
      <div className="w-full max-w-4xl flex items-center justify-center relative my-6 sm:my-8 z-10">

        {/* Left Side Floating Feature Badge (Desktop/Tablet) */}
        <div className="hidden md:flex flex-col space-y-4 absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-[#191038]/90 border border-purple-500/40 px-4 py-3 rounded-2xl backdrop-blur-md shadow-xl flex flex-col items-center text-center max-w-140px">
            <span className="text-2xl mb-1 animate-pulse">⚡</span>
            <span className="text-xs font-bold text-amber-300">Waiting for Host...</span>
          </div>
        </div>

        {/* Right Side Floating Feature Badge (Desktop/Tablet) */}
        <div className="hidden md:flex flex-col space-y-4 absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-[#191038]/90 border border-purple-500/40 px-4 py-3 rounded-2xl backdrop-blur-md shadow-xl flex flex-col items-center text-center max-w-140px">
            <span className="text-2xl mb-1">🎮</span>
            <span className="text-xs font-bold text-purple-200">The game will start automatically!</span>
          </div>
        </div>

        {/* Central Lobby Form Card */}
        <div className="w-full max-w-md relative">

          {/* Top Golden Trophy Badge Emblem */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-linear-to-b from-amber-300 via-yellow-500 to-amber-600 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center text-2xl sm:text-3xl relative group">
              🏆
            </div>
          </div>

          {/* Glassmorphism Card Container */}
          <div className="bg-[#120a2e]/90 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.35)] backdrop-blur-xl relative z-10 pt-10">

            {/* Game PIN Box */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="flex items-center space-x-3 text-purple-300/80 text-xs font-semibold tracking-widest uppercase mb-2">
                <span className="w-6 h-2px bg-linear-to-r from-transparent to-purple-400/60"></span>
                <span>Game PIN</span>
                <span className="w-6 h-2px bg-linear-to-l from-transparent to-purple-400/60"></span>
              </div>

              <div className="w-full bg-[#1b113e] border-2 border-purple-500/60 rounded-2xl py-4 px-6 text-center shadow-[0_0_30px_rgba(168,85,247,0.3)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-r from-purple-600/10 via-amber-400/10 to-purple-600/10 pointer-events-none"></div>
                <div className="text-3xl sm:text-4xl font-black tracking-[0.25em] bg-linear-to-b from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(234,179,8,0.6)]">
                  {pin}
                </div>
              </div>
            </div>

            {/* Players Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg">👥</span>
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                  Players
                </h2>
                <span className="bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {gameData.players?.length || 0}
                </span>
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {gameData.players?.map((player, idx) => {
                const avatar = avatars[idx % avatars.length];
                return (
                  <div
                    key={player.id || idx}
                    className="bg-[#1b113e]/90 border border-purple-800/60 hover:border-purple-500/80 rounded-xl p-3 flex items-center justify-between transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-linear-to-b from-indigo-700 to-purple-900 border border-purple-400/50 flex items-center justify-center text-lg shadow-inner">
                        {avatar}
                      </div>
                      <span className="font-bold text-white text-sm sm:text-base">
                        {player.nickname}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold text-purple-200">
                      <span>Score: <strong className="text-amber-300 font-extrabold">{player.score}</strong></span>
                      <span className="text-amber-400">🏆</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Waiting Status Banner */}
            <div className="mt-6 bg-[#1b113e]/80 border border-purple-700/50 rounded-2xl p-4 text-center backdrop-blur-md shadow-inner flex items-center justify-center space-x-3">
              <span className="text-2xl animate-spin">⏳</span>
              <div className="text-left">
                <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Waiting for host to start the game...
                </p>
                <p className="text-[11px] text-purple-300/70 font-medium">
                  Sit tight and get ready!
                </p>
              </div>
            </div>

          </div>
    </div>
    </div>
    </div>
  );
}

export default PlayerLobby;