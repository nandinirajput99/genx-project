import { Routes, Route, Link } from "react-router-dom";

import CreateQuiz from "./components/host/CreateQuiz";
import HostLobby from "./components/host/HostLobby";
import LiveHost from "./components/host/LiveHost";

import JoinGame from "./components/player/JoinGame";
import PlayerLobby from "./components/player/PlayerLobby";
import GameScreen from "./components/player/GameScreen";

function App() {
  return (
    <Routes>

      {/* Home */}
      <Route
        path="/"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold">
              Quiz Battle 🎯
            </h1>

            <Link
              to="/host/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Host a Quiz
            </Link>

            <Link
              to="/player/join"
              className="bg-green-600 text-white px-6 py-3 rounded-lg"
            >
              Join Game
            </Link>
          </div>
        }
      />

      {/* Host */}
      <Route
        path="/host/create"
        element={<CreateQuiz />}
      />

      <Route
        path="/host/lobby"
        element={<HostLobby />}
      />

      <Route
        path="/host/live"
        element={<LiveHost />}
      />

      {/* Player */}
      <Route
        path="/player/join"
        element={<JoinGame />}
      />

      <Route
        path="/player/lobby"
        element={<PlayerLobby />}
      />

      <Route
        path="/player/game"
        element={<GameScreen />}
      />

      </Routes>
  );
}

export default App;