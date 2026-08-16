import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { db } from "../../firebase/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { setCurrentQuestionIndex, setAnswerRevealed } from "../../redux/gameSlice";
import { setPlayers } from "../../redux/playersSlice";

export default function LiveHost() {
  const dispatch = useDispatch();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.player.players);
  
  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Fetch questions from active game session in Firebase
  useEffect(() => {
    if (!game.pin) return;
    const unsubscribe = onSnapshot(doc(db, "games", game.pin), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.questions) setQuestions(data.questions);
        if (data.players) dispatch(setPlayers(data.players));
      }
    });
    return () => unsubscribe();
  }, [game.pin, dispatch]);

  const currentQ = questions[game.currentQuestionIndex] || {};

  // Timer logic
  useEffect(() => {
    let timer;
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      dispatch(setAnswerRevealed(true));
    }
    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft, dispatch]);

  const handleStartQuestionTimer = () => {
    setTimeLeft(currentQ.timer || 20);
    setIsTimerActive(true);
    dispatch(setAnswerRevealed(false));
  };

  const handleNextQuestion = async () => {
    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      dispatch(setCurrentQuestionIndex(nextIndex));
      dispatch(setAnswerRevealed(false));
      setTimeLeft(20);
      setIsTimerActive(false);

      // Update in Firebase
      await updateDoc(doc(db, "games", game.pin), {
        currentQuestionIndex: nextIndex,
        answerRevealed: false
      });
    } else {
      alert("Quiz Finished! Check Final Podium.");
      await updateDoc(doc(db, "games", game.pin), { status: "finished" });
    }
  };


  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

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

      <div className="mb-6 text-center">
        <h3 className="text-2xl font-semibold mb-4">{currentQ.questionText || "Loading question..."}</h3>
        <div className="grid grid-cols-2 gap-4">
          {currentQ.options?.map((opt, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg font-medium text-white ${
                idx === currentQ.correctAnswer ? "bg-green-600" : "bg-indigo-500"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mb-8 justify-center">
        <button
          onClick={handleStartQuestionTimer}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
          disabled={isTimerActive}
        >
          Start Timer ⏱️
        </button>
        <button
          onClick={handleNextQuestion}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700"
        >
          Next Question / Reveal ➡️
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-bold mb-3 text-center">Live Leaderboard 📊</h4>
        <ul className="space-y-2">
          {sortedPlayers.map((p, idx) => (
            <li key={idx} className="flex justify-between bg-white p-3 rounded shadow-sm">
              <span className="font-semibold">{idx + 1}. {p.nickname}</span>
              <span className="font-bold text-indigo-600">{p.score} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}