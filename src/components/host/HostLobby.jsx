import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { setPlayers } from "../../redux/playersSlice";
import { setGame, setGameStatus } from "../../redux/gameSlice";

export default function HostLobby({ quizId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);
  const [pin, setPin] = useState("");

  useEffect(() => {
    // Generate unique Game PIN if not already created
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(generatedPin);

    const initializeGameSession = async () => {
      try {
        // Fetch quiz data to link with this game session
        const quizRef = doc(db, "quizzes", quizId || "default_quiz");
        const quizSnap = await getDoc(quizRef);
        
        const quizData = quizSnap.exists() ? quizSnap.data() : { questions: [] };

        // Create game session document in Firebase
        await setDoc(doc(db, "games", generatedPin), {
          pin: generatedPin,
          quizId: quizId || "default_quiz",
          status: "waiting",
          currentQuestionIndex: 0,
          players: [],
          questions: quizData.questions || []
        });

        // Store game session in Redux
        dispatch(setGame({
          gameId: generatedPin,
          pin: generatedPin,
          quizId: quizId || "default_quiz",
          status: "waiting",
          currentQuestionIndex: 0
        }));
      } catch (err) {
        console.error("Error starting game session:", err);
      }
    };

    initializeGameSession();
  }, [quizId, dispatch]);

  // Real-time listener for players joining
  useEffect(() => {
    if (!pin) return;
    const unsubscribe = onSnapshot(doc(db, "games", pin), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.players) {
          dispatch(setPlayers(data.players));
        }
      }
    });

    return () => unsubscribe();
  }, [pin, dispatch]);

  const handleStartGame = async () => {
    try {
      const gameRef = doc(db, "games", pin);
      await setDoc(gameRef, { status: "playing" }, { merge: true });
      dispatch(setGameStatus("playing"));
      navigate("/host/live");
    } catch (err) {
      console.error("Error starting game:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10 text-center">
      <h2 className="text-3xl font-bold mb-2 text-indigo-600">Game Lobby 🎮</h2>
      <p className="text-gray-600 mb-6">Players should go to the join screen and enter this PIN:</p>
      
      <div className="bg-indigo-50 border-2 border-dashed border-indigo-400 p-6 rounded-lg inline-block mb-6">
        <span className="text-5xl font-extrabold tracking-widest text-indigo-800">{pin || "Loading..."}</span>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Joined Players ({players.length})</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {players.length === 0 ? (
            <p className="text-gray-500 italic">Waiting for players to join...</p>
          ) : (
            players.map((p, idx) => (
              <span key={idx} className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium shadow-sm">
                {p.nickname}
              </span>
            ))
          )}
        </div>
      </div>

      <button
        onClick={handleStartGame}
        className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg text-lg w-full max-w-xs"
      >
        Start Game 🚀
      </button>
    </div>
  );
} 