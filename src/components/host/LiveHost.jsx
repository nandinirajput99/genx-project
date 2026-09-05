import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { setCurrentQuestionIndex, setAnswerRevealed, setGame } from "../../redux/gameSlice";
import { setPlayers } from "../../redux/playersSlice";
import Podium from "../common/Podium";

export default function LiveHost() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);

  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [status, setStatus] = useState("playing");

  // Recover PIN from Redux or localStorage
  const activePin = game.pin || localStorage.getItem("hostPin") || localStorage.getItem("gamePin") || "";

  // Fetch questions and live game state from active game session in Firebase
  useEffect(() => {
    if (!activePin) return;

    const unsubscribe = onSnapshot(
      doc(db, "games", activePin),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.questions) setQuestions(data.questions);
          if (data.players) dispatch(setPlayers(data.players));
          if (data.status) setStatus(data.status);

          dispatch(
            setGame({
              gameId: data.gameId || activePin,
              pin: data.pin || activePin,
              quizId: data.quizId || "",
              status: data.status || "playing",
              currentQuestionIndex: data.currentQuestionIndex || 0,
              questionStartedAt: data.questionStartedAt || null,
              answerRevealed: !!data.answerRevealed,
            })
          );
        }
      },
      (err) => {
        console.error("Host game listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [activePin, dispatch]);

  const currentQ = questions[game.currentQuestionIndex] || {};
  const questionText =
    typeof currentQ.question === "object"
      ? currentQ.question?.text
      : (currentQ.questionText || currentQ.question || "");

  const correctOption =
    typeof currentQ.correctAnswer === "number"
      ? currentQ.options?.[currentQ.correctAnswer]
      : currentQ.correctAnswer;

  // Auto-start timer when question loads or changes
  useEffect(() => {
    if (questions.length > 0 && status === "playing" && !game.answerRevealed && activePin) {
      const initialTimer = currentQ.timer || 20;
      setTimeLeft(initialTimer);
      setIsTimerActive(true);

      updateDoc(doc(db, "games", activePin), {
        questionStartedAt: Date.now(),
        questionDuration: initialTimer,
        timerActive: true,
      }).catch((err) => console.log("Firebase sync timer error:", err));
    }
  }, [game.currentQuestionIndex, questions.length, status, activePin, game.answerRevealed, currentQ.timer]);

  // 1-second countdown interval (only restarts when isTimerActive changes)
  useEffect(() => {
    if (!isTimerActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive]);

  // Score calculation helper (ensures points are added ONLY ONCE per question)
  const computeScoredPlayers = useCallback(
    (playerList, duration = 20) => {
      return playerList.map((player) => {
        // If already scored for this question, keep existing state
        if (player.scoredForQuestion === game.currentQuestionIndex) {
          return player;
        }

        const isCorrect = !!(player.answered && player.answer === correctOption);
        const remainingTime = player.timeRemaining !== undefined ? player.timeRemaining : 0;
        const speedBonus = isCorrect && duration > 0 ? Math.max(0, Math.round((remainingTime / duration) * 500)) : 0;
        const pointsToAdd = isCorrect ? 500 + speedBonus : 0;

        return {
          ...player,
          correct: isCorrect,
          score: (player.score || 0) + pointsToAdd,
          correctCount: (player.correctCount || 0) + (isCorrect ? 1 : 0),
          wrongCount: (player.wrongCount || 0) + (isCorrect ? 0 : 1),
          scoredForQuestion: game.currentQuestionIndex,
        };
      });
    },
    [correctOption, game.currentQuestionIndex]
  );

  // When timer reaches 0, auto-reveal the answer
  useEffect(() => {
    if (timeLeft === 0 && isTimerActive && activePin) {
      setIsTimerActive(false);

      const autoReveal = async () => {
        try {
          const updatedPlayers = computeScoredPlayers(players, currentQ.timer || 20);

          await updateDoc(doc(db, "games", activePin), {
            answerRevealed: true,
            players: updatedPlayers,
          });
          dispatch(setAnswerRevealed(true));
        } catch (err) {
          console.error("Error auto-revealing answer:", err);
        }
      };

      autoReveal();
    }
  }, [timeLeft, isTimerActive, activePin, players, computeScoredPlayers, currentQ.timer, dispatch]);

  const handleStartQuestionTimer = () => {
    const dur = currentQ.timer || 20;
    setTimeLeft(dur);
    setIsTimerActive(true);
    dispatch(setAnswerRevealed(false));

    if (activePin) {
      updateDoc(doc(db, "games", activePin), {
        questionStartedAt: Date.now(),
        questionDuration: dur,
        timerActive: true,
        answerRevealed: false,
      }).catch(console.error);
    }
  };

  // Next Question / Reveal
  const handleNextQuestion = async () => {
    if (!activePin) return;

    if (!game.answerRevealed) {
      // Reveal answer step
      try {
        const updatedPlayers = computeScoredPlayers(players, currentQ.timer || 20);

        await updateDoc(doc(db, "games", activePin), {
          answerRevealed: true,
          players: updatedPlayers,
        });
        dispatch(setAnswerRevealed(true));
        setIsTimerActive(false);
      } catch (err) {
        console.error("Error revealing answer:", err);
      }
      return;
    }

    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      dispatch(setCurrentQuestionIndex(nextIndex));
      dispatch(setAnswerRevealed(false));
      const nextTimer = questions[nextIndex]?.timer || 20;
      setTimeLeft(nextTimer);
      setIsTimerActive(true);

      const resetPlayers = players.map((player) => ({
        ...player,
        answer: "",
        answered: false,
        correct: null,
        timeRemaining: null,
        scoredForQuestion: null,
      }));

      await updateDoc(doc(db, "games", activePin), {
        currentQuestionIndex: nextIndex,
        answerRevealed: false,
        questionStartedAt: Date.now(),
        questionDuration: nextTimer,
        timerActive: true,
        players: resetPlayers,
      });
    } else {
      const finalPlayers = computeScoredPlayers(players, currentQ.timer || 20);
      await updateDoc(doc(db, "games", activePin), {
        status: "finished",
        players: finalPlayers,
      });
      setStatus("finished");
    }
  };

  // Fast Question Change: Host can immediately advance to next question
  const handleFastNextQuestion = async () => {
    if (!activePin) return;

    let updatedPlayers = players;
    if (!game.answerRevealed) {
      updatedPlayers = computeScoredPlayers(players, currentQ.timer || 20);
    }

    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      dispatch(setCurrentQuestionIndex(nextIndex));
      dispatch(setAnswerRevealed(false));
      const nextTimer = questions[nextIndex]?.timer || 20;
      setTimeLeft(nextTimer);
      setIsTimerActive(true);

      const resetPlayers = updatedPlayers.map((player) => ({
        ...player,
        answer: "",
        answered: false,
        correct: null,
        timeRemaining: null,
        scoredForQuestion: null,
      }));

      await updateDoc(doc(db, "games", activePin), {
        currentQuestionIndex: nextIndex,
        answerRevealed: false,
        questionStartedAt: Date.now(),
        questionDuration: nextTimer,
        timerActive: true,
        players: resetPlayers,
      });
    } else {
      await updateDoc(doc(db, "games", activePin), {
        status: "finished",
        players: updatedPlayers,
      });
      setStatus("finished");
    }
  };

  // Early End Game
  const handleEndGame = async () => {
    if (!activePin) return;
    try {
      const finalPlayers = computeScoredPlayers(players, currentQ.timer || 20);
      await updateDoc(doc(db, "games", activePin), {
        status: "finished",
        players: finalPlayers,
      });
      setStatus("finished");
    } catch (err) {
      console.error("Error ending game:", err);
    }
  };

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Live Answer Statistics
  const correctPlayersCount = players.filter(
    (p) => p.answered && (p.answer === correctOption || p.correct === true)
  ).length;

  const wrongPlayersCount = players.filter(
    (p) => p.answered && (p.answer !== correctOption || p.correct === false)
  ).length;

  const totalAnsweredCount = players.filter((p) => p.answered).length;

  // If no active session exists
  if (!activePin) {
    return (
      <div className="min-h-screen bg-[#0b071e] text-white flex items-center justify-center p-6">
        <div className="bg-[#120a2e] border border-purple-500/40 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <span className="text-5xl block mb-3">⚠️</span>
          <h2 className="text-2xl font-black mb-2">No Active Game Session</h2>
          <p className="text-purple-300 text-sm mb-6">
            You don&apos;t have an active quiz session running. Please create a quiz to start hosting.
          </p>
          <button
            onClick={() => navigate("/host/create")}
            className="w-full bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-black py-3.5 px-6 rounded-xl shadow-lg hover:brightness-105 transition cursor-pointer"
          >
            Create Quiz 🚀
          </button>
        </div>
      </div>
    );
  }

  // Finished state: Podium
  if (status === "finished") {
    const totalCorrect = sortedPlayers.reduce(
      (acc, p) => acc + (p.correctCount || (p.correct ? 1 : 0)),
      0
    );
    const totalWrong = sortedPlayers.reduce(
      (acc, p) => acc + (p.wrongCount || (p.answered && !p.correct ? 1 : 0)),
      0
    );

    return (
      <Podium
        winners={sortedPlayers.map((p) => ({
          name: p.nickname,
          score: p.score || 0,
          correctCount: p.correctCount,
          wrongCount: p.wrongCount,
        }))}
        totalCorrect={totalCorrect}
        totalWrong={totalWrong}
      />
    );
  }

  const optionLetters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="min-h-screen bg-[#0b071e] text-white py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-[#120a2e]/95 border-2 border-purple-500/50 shadow-2xl rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
        {/* Header Bar */}
        <div className="flex flex-wrap justify-between items-center mb-6 border-b border-purple-800/60 pb-4 gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Host Console</span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Question {game.currentQuestionIndex + 1} of {questions.length || 1}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-purple-900/60 border border-purple-500/40 text-amber-300 px-3 py-1 rounded-full font-bold text-xs">
              PIN: {activePin}
            </span>
            <div className={`px-4 py-1.5 rounded-full font-black text-base sm:text-lg border ${
              timeLeft <= 5
                ? "bg-red-500/20 text-red-300 border-red-500/50 animate-pulse"
                : "bg-purple-900/40 text-purple-200 border-purple-500/40"
            }`}>
              ⏳ {timeLeft}s
            </div>
          </div>
        </div>

        {/* Real-Time Answer Statistics (Correct vs Wrong) */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="bg-emerald-950/70 border border-emerald-500/50 px-4 py-2 rounded-xl text-center shadow-sm">
            <span className="text-xs sm:text-sm font-bold text-emerald-300">
              ✅ Correct: {correctPlayersCount}
            </span>
          </div>
          <div className="bg-rose-950/70 border border-rose-500/50 px-4 py-2 rounded-xl text-center shadow-sm">
            <span className="text-xs sm:text-sm font-bold text-rose-300">
              ❌ Wrong: {wrongPlayersCount}
            </span>
          </div>
          <div className="bg-purple-900/60 border border-purple-500/40 px-4 py-2 rounded-xl text-center shadow-sm">
            <span className="text-xs sm:text-sm font-bold text-purple-200">
              👥 Answered: {totalAnsweredCount} / {players.length}
            </span>
          </div>
        </div>

        {/* Question & Options */}
        <div className="mb-8 text-center">
          <h3 className="text-xl sm:text-2xl font-black mb-6 text-white leading-relaxed">
            {questionText || "Loading question..."}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options?.map((opt, idx) => {
              const letter = optionLetters[idx % optionLetters.length];
              const isCorrectOpt = opt === correctOption;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl font-bold flex items-center justify-between border transition-all ${
                    isCorrectOpt
                      ? "bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                      : "bg-[#1b113e] border-purple-800/60 text-purple-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                      isCorrectOpt ? "bg-emerald-400 text-black" : "bg-purple-900 text-purple-300"
                    }`}>
                      {letter}
                    </span>
                    <span className="text-sm sm:text-base text-left">{opt}</span>
                  </div>

                  {isCorrectOpt && (
                    <span className="text-xs bg-emerald-400 text-black px-2 py-0.5 rounded font-black">
                      CORRECT
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Host Controls */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            onClick={handleNextQuestion}
            className="bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 px-6 py-3 rounded-2xl font-black hover:brightness-105 transition cursor-pointer shadow-lg text-sm sm:text-base"
          >
            {game.answerRevealed ? "Next Question ➡️" : "Reveal Answer 🎯"}
          </button>

          <button
            onClick={handleFastNextQuestion}
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-2xl font-bold transition cursor-pointer shadow-md text-sm flex items-center gap-1.5"
            title="Skip/fast change question immediately"
          >
            <span>⚡</span>
            <span>Fast Next</span>
          </button>

          <button
            onClick={handleStartQuestionTimer}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-bold transition cursor-pointer shadow-md text-sm disabled:opacity-50"
            disabled={isTimerActive}
          >
            Restart Timer ⏱️
          </button>

          <button
            onClick={handleEndGame}
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 px-4 py-3 rounded-2xl font-bold transition cursor-pointer text-sm"
          >
            End Game 🏁
          </button>
        </div>

        {/* Live Leaderboard */}
        <div className="bg-[#1b113e]/90 border border-purple-800/60 p-5 rounded-2xl">
          <h4 className="text-base font-extrabold mb-3 text-center text-purple-200">Live Leaderboard 📊</h4>
          {sortedPlayers.length === 0 ? (
            <p className="text-center text-xs text-purple-400 italic">No players joined yet.</p>
          ) : (
            <ul className="space-y-2">
              {sortedPlayers.map((p, idx) => (
                <li key={idx} className="flex justify-between items-center bg-[#120a2e] border border-purple-900/60 px-4 py-2.5 rounded-xl">
                  <span className="font-bold text-sm text-white">{idx + 1}. {p.nickname}</span>
                  <span className="font-black text-amber-300 text-sm">{p.score || 0} pts</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}