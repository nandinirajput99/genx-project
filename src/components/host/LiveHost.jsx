import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { setCurrentQuestionIndex, setAnswerRevealed, setGame } from "../../redux/gameSlice";
import { setPlayers } from "../../redux/playersSlice";
import Podium from "../common/Podium";

export default function LiveHost() {
  const dispatch = useDispatch();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);

  const activePin = game.pin || localStorage.getItem("hostPin") || localStorage.getItem("gamePin") || "";

  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [status, setStatus] = useState("playing");

  // Restore game state in Redux if missing
  useEffect(() => {
    if (!game.pin && activePin) {
      dispatch(setGame({ pin: activePin, gameId: activePin }));
    }
  }, [game.pin, activePin, dispatch]);

  // Fetch questions and live game status from active session in Firebase
  useEffect(() => {
    if (!activePin) return;

    const unsubscribe = onSnapshot(doc(db, "games", activePin), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.questions) setQuestions(data.questions);
        if (data.players) dispatch(setPlayers(data.players));
        if (data.status) setStatus(data.status);
        if (data.currentQuestionIndex !== undefined) {
          dispatch(setCurrentQuestionIndex(data.currentQuestionIndex));
        }
        if (data.answerRevealed !== undefined) {
          dispatch(setAnswerRevealed(data.answerRevealed));
        }
      }
    });

    return () => unsubscribe();
  }, [activePin, dispatch]);

  const currentQ = questions[game.currentQuestionIndex] || {};
  const correctOption =
    typeof currentQ.correctAnswer === "number"
      ? currentQ.options?.[currentQ.correctAnswer]
      : (currentQ.correctAnswer ?? (typeof currentQ.correctIndex === "number" ? currentQ.options?.[currentQ.correctIndex] : ""));

  const questionDuration = currentQ.timer || 20;

  // Auto-start timer when question loads or changes
  useEffect(() => {
    if (questions.length > 0 && status === "playing" && !game.answerRevealed) {
      setTimeLeft(questionDuration);
      setIsTimerActive(true);

      if (activePin) {
        updateDoc(doc(db, "games", activePin), {
          questionStartedAt: Date.now(),
          questionDuration: questionDuration,
          timerActive: true,
        }).catch((err) => console.log("Firebase sync timer error:", err));
      }
    }
  }, [game.currentQuestionIndex, questions.length, status, activePin, game.answerRevealed, questionDuration]);

  // Stable references for auto-reveal
  const latestStateRef = useRef({ players, currentQ, correctOption, activePin, questionDuration, timeLeft });
  useEffect(() => {
    latestStateRef.current = { players, currentQ, correctOption, activePin, questionDuration, timeLeft };
  });

  // Calculate safe scoring without double-counting
  const calculateScoredPlayers = useCallback((playersList, targetOption, timerLimit, remainingTime) => {
    return playersList.map((player) => {
      // If player already submitted and was scored in GameScreen
      if (player.scoreAwarded) {
        return player;
      }

      // If player answered during round but score was pending
      if (player.answered) {
        const isCorrect = player.answer === targetOption;
        const availableTime = player.timeRemaining !== undefined ? player.timeRemaining : remainingTime;
        const speedBonus = Math.max(0, Math.round((availableTime / timerLimit) * 500));
        const pointsToAdd = isCorrect ? 500 + speedBonus : 0;
        return {
          ...player,
          correct: isCorrect,
          score: (player.score || 0) + pointsToAdd,
          correctCount: (player.correctCount || 0) + (isCorrect ? 1 : 0),
          wrongCount: (player.wrongCount || 0) + (isCorrect ? 0 : 1),
          scoreAwarded: true,
        };
      }

      // Player timed out without answering
      return {
        ...player,
        answered: false,
        correct: false,
        wrongCount: (player.wrongCount || 0) + 1,
        scoreAwarded: true,
      };
    });
  }, []);

  const triggerAutoReveal = useCallback(async () => {
    const { activePin: pin, correctOption: target, questionDuration: dur, timeLeft: remTime } = latestStateRef.current;
    if (!pin) return;

    try {
      const gameRef = doc(db, "games", pin);
      const freshSnap = await getDoc(gameRef);
      const currentPlayers = (freshSnap.exists() && freshSnap.data().players) || latestStateRef.current.players;

      const updatedPlayers = calculateScoredPlayers(currentPlayers, target, dur, remTime);

      await updateDoc(gameRef, {
        answerRevealed: true,
        players: updatedPlayers,
      });
      dispatch(setAnswerRevealed(true));
    } catch (err) {
      console.error("Error auto-revealing answer:", err);
    }
  }, [calculateScoredPlayers, dispatch]);

  // Countdown Timer interval
  useEffect(() => {
    if (!isTimerActive) return;

    if (timeLeft <= 0) {
      setIsTimerActive(false);
      triggerAutoReveal();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft, triggerAutoReveal]);

  const handleStartQuestionTimer = () => {
    setTimeLeft(questionDuration);
    setIsTimerActive(true);
    dispatch(setAnswerRevealed(false));
    if (activePin) {
      updateDoc(doc(db, "games", activePin), {
        questionStartedAt: Date.now(),
        questionDuration: questionDuration,
        timerActive: true,
        answerRevealed: false,
      }).catch(console.error);
    }
  };

  // Next Question / Reveal
  const handleNextQuestion = async () => {
    if (!activePin) return;

    // Step 1: Reveal Answer
    if (!game.answerRevealed) {
      try {
        const gameRef = doc(db, "games", activePin);
        const freshSnap = await getDoc(gameRef);
        const currentPlayers = (freshSnap.exists() && freshSnap.data().players) || players;

        const updatedPlayers = calculateScoredPlayers(currentPlayers, correctOption, questionDuration, timeLeft);

        await updateDoc(gameRef, {
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

    // Step 2: Advance to Next Question
    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      const nextTimer = questions[nextIndex]?.timer || 20;
      setTimeLeft(nextTimer);
      setIsTimerActive(true);
      dispatch(setCurrentQuestionIndex(nextIndex));
      dispatch(setAnswerRevealed(false));

      const gameRef = doc(db, "games", activePin);
      const freshSnap = await getDoc(gameRef);
      const currentPlayers = (freshSnap.exists() && freshSnap.data().players) || players;

      const resetPlayers = currentPlayers.map((player) => ({
        ...player,
        answer: "",
        answered: false,
        correct: null,
        timeRemaining: null,
        scoreAwarded: false,
      }));

      await updateDoc(gameRef, {
        currentQuestionIndex: nextIndex,
        answerRevealed: false,
        questionStartedAt: Date.now(),
        questionDuration: nextTimer,
        timerActive: true,
        players: resetPlayers,
      });
    } else {
      await updateDoc(doc(db, "games", activePin), { status: "finished" });
      setStatus("finished");
    }
  };

  // Fast Question Change: Host can immediately skip/advance to next question
  const handleFastNextQuestion = async () => {
    if (!activePin) return;

    let updatedPlayers = players;
    const gameRef = doc(db, "games", activePin);
    const freshSnap = await getDoc(gameRef);
    const currentPlayers = (freshSnap.exists() && freshSnap.data().players) || players;

    if (!game.answerRevealed) {
      updatedPlayers = calculateScoredPlayers(currentPlayers, correctOption, questionDuration, timeLeft);
    } else {
      updatedPlayers = currentPlayers;
    }

    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      const nextTimer = questions[nextIndex]?.timer || 20;
      setTimeLeft(nextTimer);
      setIsTimerActive(true);
      dispatch(setCurrentQuestionIndex(nextIndex));
      dispatch(setAnswerRevealed(false));

      const resetPlayers = updatedPlayers.map((player) => ({
        ...player,
        answer: "",
        answered: false,
        correct: null,
        timeRemaining: null,
        scoreAwarded: false,
      }));

      await updateDoc(gameRef, {
        currentQuestionIndex: nextIndex,
        answerRevealed: false,
        questionStartedAt: Date.now(),
        questionDuration: nextTimer,
        timerActive: true,
        players: resetPlayers,
      });
    } else {
      await updateDoc(gameRef, {
        status: "finished",
        players: updatedPlayers,
      });
      setStatus("finished");
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
          nickname: p.nickname,
          score: p.score || 0,
          correctCount: p.correctCount,
          wrongCount: p.wrongCount,
        }))}
        totalCorrect={totalCorrect}
        totalWrong={totalWrong}
      />
    );
  }

  const questionTitle =
    typeof currentQ.question === "object"
      ? currentQ.question?.text
      : (currentQ.questionText || currentQ.question || "Loading question...");

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10 border border-purple-100">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">Live Host Control</span>
          <h2 className="text-2xl font-black text-gray-800">
            Question {game.currentQuestionIndex + 1} <span className="text-gray-400 font-medium text-lg">of {questions.length}</span>
          </h2>
        </div>
        <div className={`px-5 py-2 rounded-2xl font-black text-lg shadow-sm border ${
          timeLeft <= 5 ? "bg-rose-100 text-rose-700 border-rose-300 animate-pulse" : "bg-indigo-100 text-indigo-700 border-indigo-200"
        }`}>
          ⏳ {timeLeft}s
        </div>
      </div>

      {/* Real-Time Answer Statistics (Correct vs Wrong) */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-300 px-4 py-2 rounded-xl text-center shadow-xs">
          <span className="text-sm font-bold text-emerald-700">
            ✅ Correct: {correctPlayersCount}
          </span>
        </div>
        <div className="bg-rose-50 border border-rose-300 px-4 py-2 rounded-xl text-center shadow-xs">
          <span className="text-sm font-bold text-rose-700">
            ❌ Wrong: {wrongPlayersCount}
          </span>
        </div>
        <div className="bg-purple-50 border border-purple-300 px-4 py-2 rounded-xl text-center shadow-xs">
          <span className="text-sm font-bold text-purple-700">
            👥 Answered: {totalAnsweredCount} / {players.length}
          </span>
        </div>
      </div>

      <div className="mb-8 text-center">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 px-4 leading-relaxed">
          {questionTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {currentQ.options?.map((opt, idx) => {
            const isCorrect = idx === currentQ.correctAnswer || opt === correctOption;
            const isRevealed = game.answerRevealed;

            let cardStyle = "bg-indigo-600 hover:bg-indigo-500 text-white";
            if (isRevealed && isCorrect) {
              cardStyle = "bg-emerald-600 text-white border-2 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-black";
            } else if (isRevealed && !isCorrect) {
              cardStyle = "bg-slate-200 text-slate-500 opacity-60";
            }

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl font-bold text-left transition-all duration-300 flex items-center justify-between ${cardStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center text-xs font-black">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>
                {isRevealed && isCorrect && <span>✓ Correct</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Controls */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center">
        <button
          onClick={handleNextQuestion}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black hover:bg-purple-700 active:scale-95 transition cursor-pointer shadow-md"
        >
          {game.answerRevealed ? "Next Question ➡️" : "Reveal Answer 🎯"}
        </button>

        <button
          onClick={handleFastNextQuestion}
          className="bg-amber-400 text-slate-950 px-5 py-3 rounded-xl font-black hover:bg-amber-300 active:scale-95 transition cursor-pointer shadow-md flex items-center gap-1.5"
          title="Skip/fast change question immediately"
        >
          <span>⚡</span>
          <span>Fast Next Question</span>
        </button>

        <button
          onClick={handleStartQuestionTimer}
          className="bg-slate-100 text-slate-700 border border-slate-300 px-5 py-3 rounded-xl font-bold hover:bg-slate-200 active:scale-95 transition cursor-pointer shadow-xs disabled:opacity-50"
          disabled={isTimerActive}
        >
          Restart Timer ⏱️
        </button>
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <h4 className="text-base font-extrabold mb-3 text-center text-slate-700">Live Leaderboard 📊</h4>
        {sortedPlayers.length === 0 ? (
          <p className="text-center text-slate-400 text-sm italic">No players joined yet</p>
        ) : (
          <ul className="space-y-2">
            {sortedPlayers.map((p, idx) => (
              <li key={p.id || idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-xs border border-slate-100">
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs flex items-center justify-center font-black">
                    {idx + 1}
                  </span>
                  {p.nickname}
                </span>
                <span className="font-black text-indigo-600">{p.score || 0} pts</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}