import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getRandomQuestions } from "../data/questionBank";

const initialState = {
  quizId: "",
  title: "",
  questions: [],
  loading: false,
  error: null,
  source: null, // "api" | "bank"
};

// API se questions fetch with automatic fallback to rich question bank
export const fetchQuestions = createAsyncThunk(
  "quiz/fetchQuestions",
  async (category = "all") => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      let url = "https://the-trivia-api.com/v2/questions?limit=10";
      if (category && category !== "all") {
        url += `&categories=${category}`;
      }

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return {
            questions: data,
            source: "api",
          };
        }
      }
    } catch (err) {
      console.warn(
        "Remote Trivia API unreachable or blocked by network, using built-in Question Bank:",
        err?.message || err
      );
    }

    // Always guarantee instant, high-quality questions from internal question bank
    const fallbackQuestions = getRandomQuestions(category, 10);
    return {
      questions: fallbackQuestions,
      source: "bank",
    };
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
      state.source = null;
      state.error = null;
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
        state.error = null;
        state.questions = action.payload.questions || action.payload;
        state.source = action.payload.source || "bank";
      })

      .addCase(fetchQuestions.rejected, (state) => {
        // Even in unexpected edge cases, fall back to question bank
        state.loading = false;
        state.error = null;
        state.questions = getRandomQuestions("all", 10);
        state.source = "bank";
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