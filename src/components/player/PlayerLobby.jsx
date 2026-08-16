import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { db } from "../../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";

function PlayerLobby() {
  const navigate = useNavigate();

  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);

  const [gameData, setGameData] = useState(null);

  const pin = game?.pin;

  useEffect(() => {
    if (!pin) {
      navigate("/");
      return;
    }

    const gameRef = doc(db, "games", pin);

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          navigate("/");
          return;
        }

        const data = snapshot.data();

        setGameData(data);

        // Host has started the game
        if (data.gameStarted === true) {
          navigate("/game-screen");
        }
      },
      (error) => {
        console.log("Lobby error:", error);
      }
    );

    return () => unsubscribe();
  }, [pin, navigate]);

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">
          Loading lobby...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-indigo-600">
          Game Lobby
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Waiting for the host to start the game
        </p>

        {/* Game PIN */}
        <div className="bg-indigo-50 rounded-xl p-5 mt-6 text-center">

          <p className="text-sm text-gray-500">
            Game PIN
          </p>

          <p className="text-3xl font-bold text-indigo-600 tracking-widest">
            {pin}
          </p>

        </div>

        {/* Players */}
        <div className="mt-6">

          <h2 className="text-xl font-bold mb-4">
            Players
          </h2>

          <div className="space-y-3">

            {gameData.players?.map((player) => (
              <div
                key={player.id}
                className="bg-gray-100 rounded-lg p-3 flex justify-between"
              >
                <span className="font-medium">
                  {player.nickname}
                </span>

                <span className="text-gray-500">
                  Score: {player.score}
                </span>
              </div>
            ))}

          </div>

        </div>

        {/* Waiting */}
        <div className="mt-8 text-center">

          <div className="animate-pulse text-indigo-600 font-semibold">
            Waiting for host...
          </div>

          <p className="text-sm text-gray-400 mt-2">
            The game will start automatically.
          </p>

        </div>

      </div>

    </div>
  );
}

export default PlayerLobby;