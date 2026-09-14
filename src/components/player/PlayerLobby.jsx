import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";

import { setGame, resetGame } from "../../redux/gameSlice";
import { setPlayers, clearPlayers } from "../../redux/playersSlice";

function PlayerLobby() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);

  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState("");

  // Get live game PIN
  const pin = game?.pin || localStorage.getItem("gamePin");

  // Current player's ID
  const playerId = localStorage.getItem("currentPlayerId");

  useEffect(() => {
    if (!pin || !playerId) {
      navigate("/");
      return;
    }

    const gameRef = doc(db, "games", pin);

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("This game no longer exists.");
          return;
        }

        const data = snapshot.data();

        setGameData(data);

        // --------------------------------
        // Sync game data with Redux
        // --------------------------------
        dispatch(
          setGame({
            gameId: data.gameId || pin,
            pin: data.pin || pin,
            quizId: data.quizId || "",
            status: data.status || "waiting",
            currentQuestionIndex: data.currentQuestionIndex || 0,
            questionStartedAt: data.questionStartedAt || null,
            answerRevealed: data.answerRevealed || false,
            questions: data.questions || [],
          })
        );

        // --------------------------------
        // Sync players with Redux
        // --------------------------------
        dispatch(setPlayers(data.players || []));

        // --------------------------------
        // Check whether current player
        // is still inside the game
        // --------------------------------
        const currentPlayer = (data.players || []).find(
          (player) => player.id === playerId
        );

        if (!currentPlayer) {
          setError("You are no longer part of this game.");
          return;
        }

        // --------------------------------
        // Host started the game
        // --------------------------------
        if (data.status === "playing") {
          navigate("/player/game");
          return;
        }

        // --------------------------------
        // Game finished
        // --------------------------------
        if (data.status === "finished") {
          navigate("/player/results");
        }
      },
      (firebaseError) => {
        console.error("Player lobby error:", firebaseError);
        setError("Unable to connect to the game.");
      }
    );

    return () => unsubscribe();
  }, [pin, playerId, navigate, dispatch]);

  // --------------------------------
  // Leave / reset local session
  // --------------------------------
  const handleLeaveGame = () => {
    localStorage.removeItem("gamePin");
    localStorage.removeItem("currentPlayerId");
    localStorage.removeItem("currentPlayerNickname");

    dispatch(resetGame());
    dispatch(clearPlayers());

    navigate("/");
  };

  // --------------------------------
  // Error screen
  // --------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-[#0b071e] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#120a2e] border border-red-500/40 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">

          <div className="text-5xl mb-4">⚠️</div>

          <h2 className="text-xl font-black text-white mb-2">
            Game Error
          </h2>

          <p className="text-red-300 text-sm mb-6">
            {error}
          </p>

          <button
            onClick={handleLeaveGame}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition font-bold cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------
  // Loading screen
  // --------------------------------
  if (!gameData) {
    return (
      <div className="min-h-screen bg-[#0b071e] text-white flex items-center justify-center p-4 font-sans select-none">
        <div className="flex flex-col items-center space-y-4">

          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-indigo-600 to-purple-900 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse">
            ⏳
          </div>

          <p className="text-purple-300 font-medium tracking-wide animate-pulse">
            Loading Quiz Lobby...
          </p>
        </div>
      </div>
    );
  }

  const avatars = [
    "🦉",
    "🎮",
    "🚀",
    "👑",
    "⭐",
    "🔥",
    "🎯",
    "⚡",
  ];

  const currentPlayer = gameData.players?.find(
    (player) => player.id === playerId
  );

  return (
    <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden relative font-sans select-none">

      {/* ================================
          BACKGROUND GLOW
      ================================= */}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[380px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[280px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* ================================
          DECORATIVE QUESTION MARKS
      ================================= */}

      <div className="hidden lg:flex absolute left-12 top-1/4 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] -rotate-12 animate-pulse">
        ?
      </div>

      <div className="hidden lg:flex absolute right-12 top-1/3 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] rotate-12 animate-pulse">
        ?
      </div>

      {/* ================================
          HEADER
      ================================= */}

      <div className="w-full flex justify-end max-w-5xl z-20">
        <button
          type="button"
          className="flex items-center gap-1.5 bg-[#1a1438]/80 border border-purple-500/30 text-purple-200 text-xs sm:text-sm px-3.5 py-1.5 rounded-full backdrop-blur-md hover:bg-purple-900/40 transition cursor-pointer shadow-lg"
        >
          <span>🌐</span>
          <span className="font-medium">English</span>
          <span className="text-[10px]">▼</span>
        </button>
      </div>

      {/* ================================
          HERO
      ================================= */}

      <div className="relative flex flex-col items-center mt-2 sm:mt-3 z-10">

        {/* Left speech bubble */}

        <div className="absolute -left-28 sm:-left-36 top-1 bg-[#1b103e]/90 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-bounce hidden sm:flex items-center gap-1">
          <span>Game PIN Below 👇</span>
        </div>

        {/* Right speech bubble */}

        <div className="absolute -right-28 sm:-right-36 top-1 bg-[#1b103e]/90 border border-purple-500/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-bounce hidden sm:flex items-center gap-1">
          <span>👑 Get Ready Champion!</span>
        </div>

        {/* Mascot */}

        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-indigo-600 via-purple-800 to-purple-950 border-2 border-purple-400/70 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] relative mb-2 group hover:scale-105 transition-transform duration-300">

          <span className="text-4xl sm:text-5xl drop-shadow-md">
            🦉
          </span>

          <span className="absolute -top-2 -right-1 text-xl animate-pulse">
            ⏳
          </span>

          <span className="absolute -top-3 -left-1 text-lg">
            🎓
          </span>
        </div>

        {/* Logo */}

        <div className="text-center">

          <h1
            className="text-3xl sm:text-5xl font-black tracking-wider uppercase bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]"
            style={{
              textShadow:
                "0 2px 0 #b45309, 0 4px 0 #78350f, 0 6px 12px rgba(0,0,0,0.8)",
            }}
          >
            PLAYER LOBBY
          </h1>

          <div className="mt-1 inline-block bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs sm:text-sm px-4 py-0.5 rounded-full font-bold uppercase tracking-widest shadow-md">
            Quiz Arena
          </div>
        </div>
      </div>

      {/* ================================
          MAIN CONTENT
      ================================= */}

      <div className="w-full max-w-4xl flex items-center justify-center relative my-6 sm:my-8 z-10">

        {/* LEFT BADGE */}

        <div className="hidden md:flex flex-col space-y-4 absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-[#191038]/90 border border-purple-500/40 px-4 py-3 rounded-2xl backdrop-blur-md shadow-xl flex flex-col items-center text-center max-w-[140px]">

            <span className="text-2xl mb-1 animate-pulse">
              ⚡
            </span>

            <span className="text-xs font-bold text-amber-300">
              Waiting for Host...
            </span>
          </div>
        </div>

        {/* RIGHT BADGE */}

        <div className="hidden md:flex flex-col space-y-4 absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-[#191038]/90 border border-purple-500/40 px-4 py-3 rounded-2xl backdrop-blur-md shadow-xl flex flex-col items-center text-center max-w-[140px]">

            <span className="text-2xl mb-1">
              🎮
            </span>

            <span className="text-xs font-bold text-purple-200">
              The game will start automatically!
            </span>
          </div>
        </div>

        {/* ================================
            CENTRAL CARD
        ================================= */}

        <div className="w-full max-w-md relative">

          {/* Trophy */}

          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">

            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-600 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center text-2xl sm:text-3xl relative group">
              🏆
            </div>
          </div>

          {/* CARD */}

          <div className="bg-[#120a2e]/90 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.35)] backdrop-blur-xl relative z-10 pt-10">

            {/* ================================
                PLAYER NAME
            ================================= */}

            {currentPlayer && (
              <div className="mb-5 text-center">

                <p className="text-xs text-purple-300 uppercase tracking-widest mb-1">
                  You joined as
                </p>

                <div className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-500/40 rounded-full px-4 py-2">

                  <span className="text-xl">
                    🧑‍💻
                  </span>

                  <span className="font-bold text-white">
                    {currentPlayer.nickname}
                  </span>

                </div>
              </div>
            )}

            {/* ================================
                GAME PIN
            ================================= */}

            <div className="flex flex-col items-center justify-center mb-6">

              <div className="flex items-center gap-3 text-purple-300/80 text-xs font-semibold tracking-widest uppercase mb-2">

                <span className="w-6 h-[2px] bg-gradient-to-r from-transparent to-purple-400/60" />

                <span>Game PIN</span>

                <span className="w-6 h-[2px] bg-gradient-to-l from-transparent to-purple-400/60" />

              </div>

              <div className="w-full bg-[#1b113e] border-2 border-purple-500/60 rounded-2xl py-4 px-6 text-center shadow-[0_0_30px_rgba(168,85,247,0.3)] relative overflow-hidden">

                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-amber-400/10 to-purple-600/10 pointer-events-none" />

                <div className="text-3xl sm:text-4xl font-black tracking-[0.25em] bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(234,179,8,0.6)]">
                  {pin}
                </div>
              </div>
            </div>

            {/* ================================
                PLAYERS HEADER
            ================================= */}

            <div className="flex items-center justify-between mb-4">

              <div className="flex items-center gap-2">

                <span className="text-lg">
                  👥
                </span>

                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                  Players
                </h2>

                <span className="bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {gameData.players?.length || 0}
                </span>
              </div>

              <span className="text-xs text-purple-400">
                Live
              </span>
            </div>

            {/* ================================
                PLAYERS LIST
            ================================= */}

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">

              {gameData.players?.length > 0 ? (
                gameData.players.map((player, idx) => {

                  const avatar =
                    avatars[idx % avatars.length];

                  const isMe =
                    player.id === playerId;

                  return (
                    <div
                      key={player.id || idx}
                      className={`${
                        isMe
                          ? "border-amber-400/70 bg-purple-900/50"
                          : "border-purple-800/60 bg-[#1b113e]/90"
                      } border rounded-xl p-3 flex items-center justify-between transition-all duration-200 shadow-sm hover:border-purple-500/80`}
                    >

                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-9 h-9 rounded-full bg-gradient-to-b from-indigo-700 to-purple-900 border border-purple-400/50 flex items-center justify-center text-lg shadow-inner shrink-0">
                          {avatar}
                        </div>

                        <div className="min-w-0">

                          <div className="flex items-center gap-2">

                            <span className="font-bold text-white text-sm sm:text-base truncate">
                              {player.nickname}
                            </span>

                            {isMe && (
                              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded-full font-bold">
                                YOU
                              </span>
                            )}

                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-200 shrink-0 ml-2">

                        <span>
                          Score:
                          <strong className="text-amber-300 font-extrabold ml-1">
                            {player.score || 0}
                          </strong>
                        </span>

                        <span className="text-amber-400">
                          🏆
                        </span>

                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-purple-400 text-sm">
                  Waiting for players to join...
                </div>
              )}
            </div>

            {/* ================================
                STATUS
            ================================= */}

            <div className="mt-6 bg-[#1b113e]/80 border border-purple-700/50 rounded-2xl p-4 text-center backdrop-blur-md shadow-inner flex items-center justify-center gap-3">

              <span className="text-2xl animate-spin">
                ⏳
              </span>

              <div className="text-left">

                <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Waiting for host to start the game...
                </p>

                <p className="text-[11px] text-purple-300/70 font-medium">
                  Sit tight and get ready!
                </p>

              </div>
            </div>

            {/* ================================
                LEAVE GAME
            ================================= */}

            <button
              type="button"
              onClick={handleLeaveGame}
              className="w-full mt-4 py-2.5 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition font-semibold text-sm cursor-pointer"
            >
              Leave Game
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerLobby;