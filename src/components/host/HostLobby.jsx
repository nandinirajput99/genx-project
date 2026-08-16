import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

import { setPlayers } from "../../redux/playersSlice";
import { setGame, setGameStatus, resetGame } from "../../redux/gameSlice";

export default function HostLobby({ quizId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);
  const reduxQuizId = useSelector((state) => state.quiz.quizId);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [mockFinished, setMockFinished] = useState(false);

  const activeQuizId = quizId || reduxQuizId || "default_quiz";
  const isFinished = game.status === "finished" || mockFinished;

  const playSoundOfJoy = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playNote = (freq, startTime, duration, type = "triangle") => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      
      // Joyous arpeggio (C Major)
      playNote(261.63, now, 0.3, "triangle");       // C4
      playNote(329.63, now + 0.1, 0.3, "triangle"); // E4
      playNote(392.00, now + 0.2, 0.3, "triangle"); // G4
      playNote(523.25, now + 0.3, 0.5, "sine");     // C5
      
      // Cheerful fanfare notes
      playNote(392.00, now + 0.5, 0.2, "sawtooth"); // G4
      playNote(523.25, now + 0.7, 0.6, "sine");     // C5
      
      // Warm chord
      playNote(329.63, now + 0.7, 0.6, "sine");     // E4
      playNote(659.25, now + 0.7, 0.6, "sine");     // E5
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

  useEffect(() => {
    if (isFinished) {
      playSoundOfJoy();
    }
  }, [isFinished]);

  const displayPlayers = isFinished && players.length === 0 ? [
    { nickname: "Champion Shreya 👑", score: 1500 },
    { nickname: "Smart Anshika", score: 1200 },
    { nickname: "Awesome Anchal", score: 900 },
    { nickname: "Nandini Player", score: 650 },
  ] : [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  // 1. HOST GAME PIN GENERATE KAREGA
  useEffect(() => {
    if (!activeQuizId) {
      console.error("Quiz ID is missing");
      setLoading(false);
      return;
    }

    const generatedPin = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    setPin(generatedPin);

    const createGame = async () => {
      try {
        // Quiz Firebase se fetch karo
        const quizRef = doc(db, "quizzes", activeQuizId);
        const quizSnap = await getDoc(quizRef);

        const quizData = quizSnap.exists() ? quizSnap.data() : { questions: [] };

        // 2. SAME PIN KO FIREBASE GAME ID BANAO
        const gameData = {
          gameId: generatedPin,
          pin: generatedPin,
          quizId: activeQuizId,
          status: "waiting",
          currentQuestionIndex: 0,
          questionStartedAt: null,
          answerRevealed: false,
          players: [],
          questions: quizData.questions || []
        };

        await setDoc(
          doc(db, "games", generatedPin),
          gameData
        );

        // 3. SAME PIN REDUX ME BHI SAVE KARO
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

        console.log("Game created with PIN:", generatedPin);
      } catch (err) {
        console.error("Error starting game session:", err);
        setLoading(false);
      }
    };

    createGame();
  }, [activeQuizId, dispatch]);

  // 4. FIREBASE SE PLAYERS REAL-TIME LISTEN KARO
  useEffect(() => {
    if (!pin) return;

    const gameRef = doc(db, "games", pin);

    const unsubscribe = onSnapshot(
      gameRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          console.error("Game does not exist");
          return;
        }

        const data = docSnap.data();

        if (data.players) {
          dispatch(setPlayers(data.players));
        }

        // Game state update
        dispatch(
          setGame({
            gameId: data.gameId,
            pin: data.pin,
            quizId: data.quizId,
            status: data.status,
            currentQuestionIndex:
              data.currentQuestionIndex || 0,
            questionStartedAt:
              data.questionStartedAt || null,
            answerRevealed:
              data.answerRevealed || false,
          })
        );
      },
      (error) => {
        console.error("Error listening to game:", error);
      }
    );

    return () => unsubscribe();
  }, [pin, dispatch]);

  // 5. HOST START GAME KAREGA
  const handleStartGame = async () => {
    if (!pin) return;

    if (players.length === 0) {
      alert("Please wait for players to join.");
      return;
    }

    try {
      const gameRef = doc(db, "games", pin);

      await setDoc(
        gameRef,
        {
          status: "playing",
        },
        {
          merge: true,
        }
      );

      dispatch(setGameStatus("playing"));
      navigate("/host/live");
    } catch (err) {
      console.error("Error starting game:", err);
      alert("Failed to start game.");
    }
  };

  if (isFinished) {
    const winner = displayPlayers[0];
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Confetti canvas */}
        <ConfettiCanvas />

        <div className="max-w-3xl w-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-8 text-center relative z-10 animate-fade-in">
          
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => {
                setMockFinished(false);
                if (game.status === "finished") {
                  dispatch(setGameStatus("waiting"));
                }
              }}
              className="text-gray-300 hover:text-white bg-white/15 px-4 py-2 rounded-xl transition font-semibold text-sm"
            >
              ⬅️ Back
            </button>
            <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-md">
              🏆 FINAL PODIUM & RESULTS 🏆
            </h2>
            <button
              onClick={playSoundOfJoy}
              className="bg-yellow-500 hover:bg-yellow-600 text-indigo-950 px-4 py-2 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-1"
            >
              🔊 Sound of Joy
            </button>
          </div>

          {/* Winner Card (Special Treat) */}
          {winner && (
            <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 p-1 rounded-3xl shadow-[0_0_30px_rgba(234,179,8,0.5)] mb-8 transform hover:scale-105 transition duration-300">
              <div className="bg-indigo-950 rounded-[22px] p-6 text-center">
                <span className="text-6xl block mb-2">👑</span>
                <p className="text-yellow-400 font-extrabold uppercase tracking-widest text-xs mb-1">
                  Ultimate Champion - 1st Place
                </p>
                <h3 className="text-4xl font-black text-white mb-2">{winner.nickname}</h3>
                <p className="text-2xl font-black text-yellow-300">{winner.score || 0} Points</p>
                
                {/* Winner's Treat description */}
                <div className="mt-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3">
                  <p className="text-sm text-yellow-200 font-medium">
                    🎁 <span className="underline">Royal Winner Treat</span>: You get the legendary Gold Crown, unlimited bragging rights, and a digital box of royal chocolates! 👑🍫✨
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Position List */}
          <div className="bg-black/25 rounded-2xl p-6 mb-8 max-h-[300px] overflow-y-auto border border-white/5">
            <h4 className="text-lg font-bold text-gray-300 mb-4 text-left border-b border-white/10 pb-2">
              Leaderboard Rankings & Rewards
            </h4>
            <div className="space-y-3">
              {displayPlayers.map((player, idx) => {
                let badge = `${idx + 1}th`;
                let badgeStyle = "bg-white/10 text-white";
                let treat = "Chocolate Coin 🪙";
                
                if (idx === 0) {
                  badge = "🥇 1st";
                  badgeStyle = "bg-yellow-500 text-indigo-950 font-bold";
                  treat = "Royal Gold Crown & Box of Chocolates 👑🍫";
                } else if (idx === 1) {
                  badge = "🥈 2nd";
                  badgeStyle = "bg-slate-300 text-slate-900 font-bold";
                  treat = "Silver Medal & Pack of Gummy Bears 🥈🍬";
                } else if (idx === 2) {
                  badge = "🥉 3rd";
                  badgeStyle = "bg-amber-600 text-white font-bold";
                  treat = "Bronze Medal & Sweet Lollipop 🥉🍭";
                } else {
                  treat = "Good Game Badge & Chocolate Coin 🪙🍫";
                }

                return (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 gap-2 text-left">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${badgeStyle}`}>
                        {badge}
                      </span>
                      <span className="font-extrabold text-white text-lg">{player.nickname}</span>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <span className="font-black text-indigo-300">{player.score || 0} pts</span>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                        🎁 {treat}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setMockFinished(false);
                dispatch(resetGame());
                navigate("/host/create");
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition duration-200 text-md"
            >
              Host Another Quiz 🚀
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-2xl p-8 text-center">

        <h2 className="text-3xl font-bold mb-2 text-indigo-600">
          Game Lobby 🎮
        </h2>

        <p className="text-gray-600 mb-6">
          Ask players to enter this Game PIN:
        </p>

        {/* GAME PIN */}
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-400 p-6 rounded-xl inline-block mb-8">
          <p className="text-sm text-gray-500 mb-2">
            GAME PIN
          </p>

          <span className="text-5xl font-extrabold tracking-widest text-indigo-800">
            {loading ? "Loading..." : pin}
          </span>
        </div>

        {/* PLAYERS */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Joined Players ({players.length})
          </h3>

          {players.length === 0 ? (
            <p className="text-gray-500 italic">
              Waiting for players to join...
            </p>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {players.map((player, index) => (
                <span
                  key={player.id || index}
                  className="bg-indigo-100 text-indigo-800 px-5 py-2 rounded-full font-medium shadow-sm"
                >
                  {player.nickname}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* START GAME */}
        <div className="flex flex-col gap-3 items-center justify-center">
          <button
            onClick={handleStartGame}
            disabled={loading || players.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-lg shadow-lg text-lg w-full max-w-xs"
          >
            {players.length === 0
              ? "Waiting for Players..."
              : "Start Game 🚀"}
          </button>

          <button
            onClick={() => setMockFinished(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 font-bold px-6 py-2 rounded-lg text-sm shadow-sm transition"
          >
            🧪 Preview Final Podium & Treats
          </button>
        </div>

      </div>
    </div>
  );
}

const ConfettiCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#FFD700", "#FFC0CB", "#00FFFF", "#FF4500", "#32CD32", "#FF00FF"];
    const particles = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        if (p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-50" />;
};