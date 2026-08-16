import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
function GameScreen() {
  const navigate = useNavigate();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);
  const [gameData, setGameData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const pin = game?.pin;

  const currentPlayer = players?.[players.length - 1];

  useEffect(() => {
    if (!pin) {
      navigate("/");
      return;
    }

    const gameRef = doc(db, "games", pin);

    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (!snapshot.exists()) {
        navigate("/");
        return;
      }

      const data = snapshot.data();

      setGameData(data);
    });

    return () => unsubscribe();
  }, [pin, navigate]);

  const handleAnswer = (answer) => {
    if (submitted) {
      return;
    }

    setSelectedAnswer(answer);
  };

  const submitAnswer = async () => {
    if (selectedAnswer === "" || submitted) {
      return;
    }

    try {
      const gameRef = doc(db, "games", pin);

      const updatedPlayers = gameData.players.map((player) => {
        if (player.id === currentPlayer?.id) {
          return {
            ...player,
            answer: selectedAnswer,
            answered: true,
          };
        }

        return player;
      });

      await updateDoc(gameRef, {
        players: updatedPlayers,
      });

      setSubmitted(true);

    } catch (error) {
      console.log("Answer submit error:", error);
    }
  };

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">
          Loading question...
        </p>
      </div>
    );
  }

  const question = gameData.questions?.[gameData.currentQuestion];

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold">
          Waiting for question...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">

        {/* Top */}
        <div className="flex justify-between items-center mb-8">

          <p className="text-gray-500">
            Question {gameData.currentQuestion + 1}
          </p>

          <p className="font-bold text-indigo-600">
            Score: {currentPlayer?.score || 0}
          </p>

        </div>

        {/* Question */}
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          {question.question}
        </h1>

        {/* Options */}
        <div className="space-y-4">

          {question.options?.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={submitted}
              className={`w-full text-left p-4 rounded-lg border font-medium transition
                ${
                  selectedAnswer === option
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white border-gray-300 hover:bg-indigo-50"
                }
              `}
            >
              {option}
            </button>
          ))}

        </div>

        {/* Submit */}
        <button
          onClick={submitAnswer}
          disabled={selectedAnswer === "" || submitted}
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300"
        >
          {submitted ? "Answer Submitted" : "Submit Answer"}
        </button>

        {/* Waiting */}
        {submitted && (
          <p className="text-center text-gray-500 mt-5">
            Waiting for the next question...
          </p>
        )}

      </div>

    </div>
  );
}

export default GameScreen;