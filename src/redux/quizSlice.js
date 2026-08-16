import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  quizId: "",
  title: "",
  questions: [],
  loading: false,
  error: null,
};

// API se questions fetch
export const fetchQuestions = createAsyncThunk(
  "quiz/fetchQuestions",
  async () => {
    const response = await fetch(
      "https://the-trivia-api.com/v2/questions?limit=10"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch questions");
    }

    const data = await response.json();

    return data;
  }
);

const quizSlice = createSlice({
  name: "quiz",

  initialState,

  reducers: {
    setQuiz: (state, action) => {
      state.quizId = action.payload.quizId;
      state.title = action.payload.title;
      state.questions = action.payload.questions;
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

  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload;
      })

      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setQuiz,
  addQuestion,
  removeQuestion,
  clearQuiz,
} = quizSlice.actions;

export default quizSlice.reducer;