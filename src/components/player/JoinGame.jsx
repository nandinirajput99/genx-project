import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addPlayer } from "../../redux/playersSlice";
import { setGame } from "../../redux/gameSlice";
import { db } from "../../firebase/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

function JoinGame() {
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();

    setError("");

    if (pin.trim() === "" || nickname.trim() === "") {
      setError("Please enter Game PIN and Nickname");
      return;
    }

    try {
      setLoading(true);

      const gamePin = pin.trim();
      const playerName = nickname.trim();

      // Check game in Firebase
      const gameRef = doc(db, "games", gamePin);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        setError("Invalid Game PIN");
        return;
      }

      const gameData = gameSnap.data();

      // Create player
      const playerData = {
        id: "player_" + Date.now(),
        nickname: playerName,
        score: 0,
      };

      // Add player to Firebase
      await updateDoc(gameRef, {
        players: arrayUnion(playerData),
      });

      // Add player to Redux
      dispatch(addPlayer(playerData));

      // Save game information in Redux
      dispatch(
        setGame({
          gameId: gamePin,
          pin: gamePin,
          quizId: gameData.quizId || "",
          status: gameData.status || "waiting",
        })
      );

      // Go to Player Lobby
      navigate("/player-lobby");

    } catch (error) {
      console.log("Join Game Error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-indigo-600">
          Quiz Battle
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Join the game
        </p>

        <form onSubmit={handleJoin}>

          {/* Game PIN */}
          <div className="mb-5">

            <label className="block font-semibold text-gray-700 mb-2">
              Game PIN
            </label>

            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter Game PIN"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500"
            />

          </div>

          {/* Nickname */}
          <div className="mb-5">

            <label className="block font-semibold text-gray-700 mb-2">
              Nickname
            </label>

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500"
            />

          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm mb-4">
              {error}
            </p>
          )}

          {/* Join Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? "Joining..." : "Join Game"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default JoinGame;