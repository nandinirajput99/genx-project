import { createSlice } from "@reduxjs/toolkit";
const initialState = {quizId: "",title: "",questions: [],};
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setQuiz: (state, action) => {state.quizId = action.payload.quizId;state.title = action.payload.title;state.questions = action.payload.questions;
    },

    addQuestion: (state, action) => {
      state.questions.push(action.payload);
    },

    removeQuestion: (state, action) => {
      state.questions.splice(action.payload, 1);
    },

    clearQuiz: (state) => {
      state.quizId = "";
      state.title = "";
      state.questions = [];
    },
  },
});

export const {
  setQuiz,
  addQuestion,
  removeQuestion,
  clearQuiz,
} = quizSlice.actions;

export default quizSlice.reducer;