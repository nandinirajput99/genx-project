import { Routes, Route } from "react-router-dom";

import Login from "./components/auth/Login";
import SignUp from "./components/auth/SignUp";
import GameOptions from "./components/game/GameOptions";

import CreateQuiz from "./components/host/CreateQuiz";
import HostLobby from "./components/host/HostLobby";
import LiveHost from "./components/host/LiveHost";

import JoinGame from "./components/player/JoinGame";
import PlayerLobby from "./components/player/PlayerLobby";
import GameScreen from "./components/player/GameScreen";

function App() {
  return (
    <Routes>
      {/* First screen: Authentication */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Second screen: Game Options */}
      <Route path="/game-options" element={<GameOptions />} />

      {/* Direct /join and /host routes */}
      <Route path="/join" element={<JoinGame />} />
      <Route path="/host" element={<CreateQuiz />} />

      {/* Existing Host routes */}
      <Route path="/host/create" element={<CreateQuiz />} />
      <Route path="/host/lobby" element={<HostLobby />} />
      <Route path="/host/live" element={<LiveHost />} />

      {/* Existing Player routes */}
      <Route path="/player/join" element={<JoinGame />} />
      <Route path="/player/lobby" element={<PlayerLobby />} />
      <Route path="/player/game" element={<GameScreen />} />
    </Routes>
  );
}

export default App;