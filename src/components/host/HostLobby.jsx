import React, { useEffect, useState } from "react";
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
import { setGame, setGameStatus } from "../../redux/gameSlice";

export default function HostLobby({ quizId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);
  const reduxQuizId = useSelector((state) => state.quiz.quizId);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);

  const activeQuizId = quizId || reduxQuizId || "default_quiz";

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
        <button
          onClick={handleStartGame}
          disabled={loading || players.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-lg shadow-lg text-lg w-full max-w-xs"
        >
          {players.length === 0
            ? "Waiting for Players..."
            : "Start Game 🚀"}
        </button>

      </div>
    </div>
  );
}