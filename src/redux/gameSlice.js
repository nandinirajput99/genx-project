import { createSlice } from "@reduxjs/toolkit";
const initialState = {gameId: "",pin: "",quizId: "",status: "waiting",currentQuestionIndex: 0,questionStartedAt: null,answerRevealed: false,};
const gameSlice = createSlice({
  name: "game",initialState, reducers: {
    setGame: (state, action) => {Object.assign(state, action.payload);},
    setGameStatus: (state, action) => {state.status = action.payload;},
    setCurrentQuestionIndex: (state, action) => {
      state.currentQuestionIndex = action.payload;
    },
    setQuestionStartedAt: (state, action) => {
      state.questionStartedAt = action.payload;
    },
    setAnswerRevealed: (state, action) => {
      state.answerRevealed = action.payload;
    },
    resetGame: () => initialState,
  },
});
export const {setGame,setGameStatus,setCurrentQuestionIndex,setQuestionStartedAt,setAnswerRevealed,resetGame,} = gameSlice.actions;
export default gameSlice.reducer;