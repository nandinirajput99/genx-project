import { configureStore } from "@reduxjs/toolkit";
import quizReducer from "./quizSlice";
import gameReducer from "./gameSlice";
import playersReducer from "./playersSlice";
export const store = configureStore({
  reducer: {
    quiz: quizReducer,
    game: gameReducer,
    players: playersReducer,
  },
});