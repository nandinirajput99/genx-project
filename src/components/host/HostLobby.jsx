import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";

import { setPlayers, addPlayer } from "../../redux/playersSlice";
import { setGame, setGameStatus, resetGame } from "../../redux/gameSlice";

export default function HostLobby({ quizId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);
  const reduxQuizId = useSelector((state) => state.quiz.quizId);

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const activeQuizId = quizId || reduxQuizId || "default_quiz";

  // Web Audio sound for lobby events
  const playChime = (type = "join") => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      if (type === "join") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      } else {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.25);
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio error ignored
    }
  };

  // 1. Generate PIN and create fresh waiting game session
  useEffect(() => {
    dispatch(resetGame());

    if (!activeQuizId) {
      console.error("Quiz ID is missing");
      setLoading(false);
      return;
    }

    const generatedPin = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    setPin(generatedPin);
    localStorage.setItem("hostPin", generatedPin);
    localStorage.setItem("gamePin", generatedPin);

    const createGame = async () => {
      try {
        const quizRef = doc(db, "quizzes", activeQuizId);
        const quizSnap = await getDoc(quizRef);
        const quizData = quizSnap.exists() ? quizSnap.data() : { questions: [] };

        const gameData = {
          gameId: generatedPin,
          pin: generatedPin,
          quizId: activeQuizId,
          status: "waiting",
          currentQuestionIndex: 0,
          questionStartedAt: null,
          answerRevealed: false,
          players: [],
          questions: quizData.questions || [],
        };

        await setDoc(doc(db, "games", generatedPin), gameData);

        dispatch(
          setGame({
            gameId: generatedPin,
            pin: generatedPin,
            quizId: activeQuizId,
            status: "waiting",
            currentQuestionIndex: 0,
            questionStartedAt: null,
            answerRevealed: false,
          })
        );

        setLoading(false);
      } catch (err) {
        console.error("Error creating game session:", err);
        setLoading(false);
      }
    };

    createGame();
  }, [activeQuizId, dispatch]);

  // 2. Real-time Firebase listener for joined players
  useEffect(() => {
    if (!pin) return;

    const gameRef = doc(db, "games", pin);

    const unsubscribe = onSnapshot(
      gameRef,
      (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();

        if (data.players) {
          dispatch(setPlayers(data.players));
        }

        if (data.status && data.status !== "waiting" && data.status === "playing") {
          navigate("/host/live");
        }
      },
      (error) => {
        console.error("Error listening to game lobby:", error);
      }
    );

    return () => unsubscribe();
  }, [pin, dispatch, navigate]);

  // Copy PIN to clipboard
  const handleCopyPin = () => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add demo bot player for 1-click solo testing
  const handleAddDemoBot = async () => {
    if (!pin) return;
    const botPool = [
      "Alex Gamer 🎮",
      "Quiz Whiz 🧠",
      "Speedy Spark ⚡",
      "Neon Star ⭐",
      "Lucky Champion 👑",
      "Byte Boss 💻",
    ];
    const botName = botPool[players.length % botPool.length];
    const newBot = {
      id: "bot_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      nickname: botName,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      answered: false,
      correct: null,
    };

    try {
      await updateDoc(doc(db, "games", pin), {
        players: arrayUnion(newBot),
      });
      dispatch(addPlayer(newBot));
      playChime("join");
    } catch (err) {
      console.error("Error adding demo bot:", err);
    }
  };

  // Host starts the live game
  const handleStartGame = async () => {
    if (!pin) return;

    if (players.length === 0) {
      alert("Please wait for at least 1 player to join, or click 'Add Demo Bot' to test!");
      return;
    }

    try {
      setStarting(true);
      playChime("start");

      const gameRef = doc(db, "games", pin);

      await setDoc(
        gameRef,
        {
          status: "playing",
          currentQuestionIndex: 0,
          questionStartedAt: Date.now(),
          questionDuration: 20,
          timerActive: true,
          answerRevealed: false,
        },
        { merge: true }
      );

      dispatch(setGameStatus("playing"));
      navigate("/host/live");
    } catch (err) {
      console.error("Error starting game:", err);
      alert("Failed to start game.");
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-950 via-purple-900 to-slate-950 px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-center items-center select-none">
      <div className="mx-auto max-w-2xl w-full">

        {/* Top Header Card */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-200 backdrop-blur-md">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Lobby Open &bull; Waiting for Players
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Quiz Battle Lobby 🎮
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Share the Game PIN below with your players so they can join the battle!
          </p>
        </div>

        {/* Main Lobby Card */}
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center">

          {/* Game PIN Display */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">
              GAME PIN
            </p>

            <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-slate-950/60 border-2 border-indigo-500/40 rounded-2xl p-4 sm:px-8 shadow-inner">
              <span className="text-5xl sm:text-6xl font-black tracking-widest text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                {loading ? "••••••" : pin}
              </span>

              <button
                onClick={handleCopyPin}
                disabled={loading || !pin}
                className="mt-2 sm:mt-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-4 py-2 text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1.5"
                title="Copy PIN to clipboard"
              >
                {copied ? "✅ Copied!" : "📋 Copy PIN"}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Players visit <strong>/player/join</strong> (or click Join Quiz) and enter this PIN.
            </p>
          </div>

          {/* Joined Players Section */}
          <div className="mb-8 border-t border-white/10 pt-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>👥 Joined Players</span>
                <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2.5 py-0.5 text-xs font-black text-indigo-300">
                  {players.length}
                </span>
              </h3>

              <button
                onClick={handleAddDemoBot}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                title="Add a simulated player to test the game"
              >
                🤖 Add Demo Bot
              </button>
            </div>

            {players.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
                <div className="text-4xl mb-2 animate-bounce">⏳</div>
                <p className="text-sm font-semibold text-slate-300">
                  Waiting for players to enter PIN...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Testing solo? Click <span className="font-bold text-indigo-300">&apos;Add Demo Bot&apos;</span> above!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                {players.map((player, index) => (
                  <div
                    key={player.id || index}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left transition hover:border-indigo-400/40 hover:bg-white/10"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-xs font-black text-indigo-300">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {player.nickname}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center border-t border-white/10 pt-6">
            <button
              onClick={() => navigate("/host/create")}
              className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition cursor-pointer"
            >
              ⬅️ Edit Questions
            </button>

            <button
              onClick={handleStartGame}
              disabled={loading || players.length === 0 || starting}
              className="w-full sm:w-auto flex-1 rounded-xl bg-linear-to-r from-emerald-500 via-green-500 to-emerald-600 px-8 py-3.5 text-base font-black text-white shadow-xl shadow-green-900/40 transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-green-500 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {starting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Starting Battle...
                </span>
              ) : players.length === 0 ? (
                "Waiting for Players to Join..."
              ) : (
                `Start Game with ${players.length} Player${players.length > 1 ? "s" : ""} 🚀`
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
