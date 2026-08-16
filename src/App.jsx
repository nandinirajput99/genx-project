import { useDispatch, useSelector } from "react-redux";
import { setGameStatus } from "./redux/gameSlice";

function App() {
  const dispatch = useDispatch();

  const status = useSelector(
    (state) => state.game.status
  );

  return (
    <div>
      <h1>Quiz Battle</h1>

      <h2>Game Status: {status}</h2>

      <button
        onClick={() =>
          dispatch(setGameStatus("question"))
        }
      >
        Start Question
      </button>

      <button
        onClick={() =>
          dispatch(setGameStatus("leaderboard"))
        }
      >
        Show Leaderboard
      </button>
    </div>
  );
}

export default App;