import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  quizId: "",
  title: "",
  questions: [],
  loading: false,
  error: null,
};

// API se questions fetch with graceful offline/error fallback
export const fetchQuestions = createAsyncThunk(
  "quiz/fetchQuestions",
  async () => {
    try {
      const response = await fetch(
        "https://the-trivia-api.com/v2/questions?limit=10"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch questions from API");
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No questions received");
      }

      return data;
    } catch (err) {
      console.warn("Trivia API request failed, using high-quality sample questions:", err);
      // High-quality fallback questions in Trivia API format
      return [
        {
          id: "fb_1",
          question: { text: "Which planet is known as the Red Planet?" },
          correctAnswer: "Mars",
          incorrectAnswers: ["Venus", "Jupiter", "Mercury"]
        },
        {
          id: "fb_2",
          question: { text: "What is the capital city of France?" },
          correctAnswer: "Paris",
          incorrectAnswers: ["Rome", "Berlin", "Madrid"]
        },
        {
          id: "fb_3",
          question: { text: "How many elements are in the periodic table?" },
          correctAnswer: "118",
          incorrectAnswers: ["108", "124", "112"]
        },
        {
          id: "fb_4",
          question: { text: "Which technology is primarily used to style web pages?" },
          correctAnswer: "CSS",
          incorrectAnswers: ["HTML", "Python", "SQL"]
        },
        {
          id: "fb_5",
          question: { text: "What is the fastest land animal in the world?" },
          correctAnswer: "Cheetah",
          incorrectAnswers: ["Lion", "Pronghorn", "Gazelle"]
        },
        {
          id: "fb_6",
          question: { text: "Which ocean is the largest on Earth?" },
          correctAnswer: "Pacific Ocean",
          incorrectAnswers: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"]
        },
        {
          id: "fb_7",
          question: { text: "In computing, what does 'CPU' stand for?" },
          correctAnswer: "Central Processing Unit",
          incorrectAnswers: ["Central Process Utility", "Computer Power Unit", "Core Program Universal"]
        }
      ];
    }
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