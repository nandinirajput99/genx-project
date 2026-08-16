import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  gameId: "",
  pin: "",
  quizId: "",

  status: "waiting",

  currentQuestionIndex: 0,

  questionStartedAt: null,

  answerRevealed: false,

  // Answer statistics
  correctAnswers: 0,
  wrongAnswers: 0,
};

const gameSlice = createSlice({
  name: "game",

  initialState,

  reducers: {
    setGame: (state, action) => {
      Object.assign(state, action.payload);
    },

    setGameStatus: (state, action) => {
      state.status = action.payload;
    },

    setCurrentQuestionIndex: (state, action) => {
      state.currentQuestionIndex = action.payload;
    },

    setQuestionStartedAt: (state, action) => {
      state.questionStartedAt = action.payload;
    },

    setAnswerRevealed: (state, action) => {
      state.answerRevealed = action.payload;
    },

    // Correct answer
    incrementCorrect: (state) => {
      state.correctAnswers += 1;
    },

    // Wrong answer
    incrementWrong: (state) => {
      state.wrongAnswers += 1;
    },

    resetGame: () => initialState,
  },
});
export const {
  setGame,
  setGameStatus,
  setCurrentQuestionIndex,
  setQuestionStartedAt,
  setAnswerRevealed,
  incrementCorrect,
  incrementWrong,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;