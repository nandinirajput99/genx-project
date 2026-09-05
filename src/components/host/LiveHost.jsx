import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { db } from "../../firebase/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { setCurrentQuestionIndex, setAnswerRevealed } from "../../redux/gameSlice";
import { setPlayers } from "../../redux/playersSlice";
import Podium from "../common/Podium";

export default function LiveHost() {
  const dispatch = useDispatch();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);
  
  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [status, setStatus] = useState("playing");

  // Fetch questions from active game session in Firebase
  useEffect(() => {
    if (!game.pin) return;
    const unsubscribe = onSnapshot(doc(db, "games", game.pin), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.questions) setQuestions(data.questions);
        if (data.players) dispatch(setPlayers(data.players));
        if (data.status) setStatus(data.status);
      }
    });
    return () => unsubscribe();
  }, [game.pin, dispatch]);

  const currentQ = questions[game.currentQuestionIndex] || {};
  const correctOption =
    typeof currentQ.correctAnswer === "number"
      ? currentQ.options?.[currentQ.correctAnswer]
      : currentQ.correctAnswer;

  // Auto-start timer when question loads or changes
  useEffect(() => {
    if (questions.length > 0 && status === "playing" && !game.answerRevealed) {
      const initialTimer = currentQ.timer || 20;
      setTimeLeft(initialTimer);
      setIsTimerActive(true);

      if (game.pin) {
        updateDoc(doc(db, "games", game.pin), {
          questionStartedAt: Date.now(),
          questionDuration: initialTimer,
          timerActive: true,
        }).catch((err) => console.log("Firebase sync timer error:", err));
      }
    }
  }, [game.currentQuestionIndex, questions.length, status, game.pin, game.answerRevealed, currentQ.timer]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      
      const autoReveal = async () => {
        try {
          const updatedPlayers = players.map((player) => {
            const isCorrect = player.answer === correctOption;
            const speedBonus = player.timeRemaining !== undefined
              ? Math.max(0, Math.round((player.timeRemaining / (currentQ.timer || 20)) * 500))
              : 0;
            const pointsToAdd = isCorrect ? 500 + speedBonus : 0;
            return {
              ...player,
              correct: isCorrect,
              score: (player.score || 0) + pointsToAdd,
              correctCount: (player.correctCount || 0) + (isCorrect ? 1 : 0),
              wrongCount: (player.wrongCount || 0) + (isCorrect ? 0 : (player.answered ? 1 : 0)),
            };
          });

          await updateDoc(doc(db, "games", game.pin), {
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
    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft, dispatch, currentQ, players, game.pin, correctOption]);

  const handleStartQuestionTimer = () => {
    setTimeLeft(currentQ.timer || 20);
    setIsTimerActive(true);
    dispatch(setAnswerRevealed(false));
    if (game.pin) {
      updateDoc(doc(db, "games", game.pin), {
        questionStartedAt: Date.now(),
        questionDuration: currentQ.timer || 20,
        timerActive: true,
      }).catch(console.error);
    }
  };

  // Next Question / Reveal
  const handleNextQuestion = async () => {
    if (!game.answerRevealed) {
      try {
        const updatedPlayers = players.map((player) => {
          const isCorrect = player.answer === correctOption;
          const speedBonus = player.timeRemaining !== undefined
            ? Math.max(0, Math.round((player.timeRemaining / (currentQ.timer || 20)) * 500))
            : Math.max(0, Math.round((timeLeft / (currentQ.timer || 20)) * 500));
          const pointsToAdd = isCorrect ? 500 + speedBonus : 0;
          return {
            ...player,
            correct: isCorrect,
            score: (player.score || 0) + pointsToAdd,
            correctCount: (player.correctCount || 0) + (isCorrect ? 1 : 0),
            wrongCount: (player.wrongCount || 0) + (isCorrect ? 0 : (player.answered ? 1 : 0)),
          };
        });

        await updateDoc(doc(db, "games", game.pin), {
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
      }));

      // Update in Firebase
      await updateDoc(doc(db, "games", game.pin), {
        currentQuestionIndex: nextIndex,
        answerRevealed: false,
        questionStartedAt: Date.now(),
        questionDuration: nextTimer,
        timerActive: true,
        players: resetPlayers,
      });
    } else {
      await updateDoc(doc(db, "games", game.pin), { status: "finished" });
      setStatus("finished");
    }
  };

  // Fast Question Change: Host can immediately skip/advance to next question
  const handleFastNextQuestion = async () => {
    let updatedPlayers = players;
    if (!game.answerRevealed) {
      updatedPlayers = players.map((player) => {
        const isCorrect = player.answer === correctOption;
        const speedBonus = player.timeRemaining !== undefined
          ? Math.max(0, Math.round((player.timeRemaining / (currentQ.timer || 20)) * 500))
          : 0;
        const pointsToAdd = isCorrect ? 500 + speedBonus : 0;
        return {
          ...player,
          correct: isCorrect,
          score: (player.score || 0) + pointsToAdd,
          correctCount: (player.correctCount || 0) + (isCorrect ? 1 : 0),
          wrongCount: (player.wrongCount || 0) + (isCorrect ? 0 : (player.answered ? 1 : 0)),
        };
      });
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
      }));

      await updateDoc(doc(db, "games", game.pin), {
        currentQuestionIndex: nextIndex,
        answerRevealed: false,
        questionStartedAt: Date.now(),
        questionDuration: nextTimer,
        timerActive: true,
        players: resetPlayers,
      });
    } else {
      await updateDoc(doc(db, "games", game.pin), {
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
          score: p.score || 0,
          correctCount: p.correctCount,
          wrongCount: p.wrongCount,
        }))}
        totalCorrect={totalCorrect}
        totalWrong={totalWrong}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-700">
          Question {game.currentQuestionIndex + 1} of {questions.length}
        </h2>
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold text-lg">
          ⏳ {timeLeft}s
        </div>
      </div>

      {/* Real-Time Answer Statistics (Correct vs Wrong) */}
      <div className="flex items-center justify-center gap-4 mb-5">
        <div className="bg-green-50 border border-green-300 px-4 py-2 rounded-xl text-center shadow-xs">
          <span className="text-sm font-bold text-green-700">
            ✅ Correct: {correctPlayersCount}
          </span>
        </div>
        <div className="bg-red-50 border border-red-300 px-4 py-2 rounded-xl text-center shadow-xs">
          <span className="text-sm font-bold text-red-700">
            ❌ Wrong: {wrongPlayersCount}
          </span>
        </div>
        <div className="bg-purple-50 border border-purple-300 px-4 py-2 rounded-xl text-center shadow-xs">
          <span className="text-sm font-bold text-purple-700">
            👥 Answered: {totalAnsweredCount} / {players.length}
          </span>
        </div>
      </div>

      <div className="mb-6 text-center">
        <h3 className="text-2xl font-semibold mb-4">{currentQ.questionText || currentQ.question || "Loading question..."}</h3>
        <div className="grid grid-cols-2 gap-4">
          {currentQ.options?.map((opt, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg font-medium text-white ${
                idx === currentQ.correctAnswer || opt === correctOption
                  ? "bg-green-600"
                  : "bg-indigo-500"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>

      {/* Host Controls */}
      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        <button
          onClick={handleNextQuestion}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-purple-700 transition cursor-pointer shadow-md"
        >
          {game.answerRevealed ? "Next Question ➡️" : "Reveal Answer 🎯"}
        </button>

        {/* Fast Change Question Button */}
        <button
          onClick={handleFastNextQuestion}
          className="bg-amber-500 text-slate-950 px-6 py-2.5 rounded-lg font-extrabold hover:bg-amber-400 transition cursor-pointer shadow-md flex items-center gap-1.5"
          title="Skip/fast change question immediately"
        >
          <span>⚡</span>
          <span>Fast Next Question</span>
        </button>

        <button
          onClick={handleStartQuestionTimer}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs disabled:opacity-50"
          disabled={isTimerActive}
        >
          Restart Timer ⏱️
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-bold mb-3 text-center">Live Leaderboard 📊</h4>
        <ul className="space-y-2">
          {sortedPlayers.map((p, idx) => (
            <li key={idx} className="flex justify-between bg-white p-3 rounded shadow-xs">
              <span className="font-semibold">{idx + 1}. {p.nickname}</span>
              <span className="font-bold text-indigo-600">{p.score || 0} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}