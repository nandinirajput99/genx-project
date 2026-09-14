import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getRandomQuestions } from "../data/questionBank";

import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

// ======================================================
// INITIAL STATE
// ======================================================

const initialState = {
  quizId: "",
  title: "",
  questions: [],

  // public / private
  visibility: "public",

  // Private quiz PIN
  pin: "",

  // All public quizzes
  publicQuizzes: [],

  // Currently selected quiz
  currentQuiz: null,

  // Quiz created by host
  createdQuiz: null,

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

// ======================================================
// CREATE QUIZ
// ======================================================

export const createQuiz = createAsyncThunk(
  "quiz/createQuiz",

  async ({ title, questions, visibility }, thunkAPI) => {
    try {
      // Validate title
      if (!title || !title.trim()) {
        throw new Error("Quiz title is required");
      }

      // Validate questions
      if (!questions || questions.length === 0) {
        throw new Error("Please add questions first");
      }

      // Validate visibility
      const quizVisibility =
        visibility === "private" ? "private" : "public";

      // Generate private quiz PIN
      const pin =
        quizVisibility === "private"
          ? Math.floor(
              100000 + Math.random() * 900000
            ).toString()
          : "";

      // Data to store in Firestore
      const quizData = {
        title: title.trim(),
        questions,
        visibility: quizVisibility,
        pin,
        createdAt: Date.now(),
      };

      // Create Firestore document
      const docRef = await addDoc(
        collection(db, "quizzes"),
        quizData
      );

      // Return created quiz
      return {
        id: docRef.id,
        ...quizData,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to create quiz"
      );
    }
  }
);

// ======================================================
// FETCH PUBLIC QUIZZES
// ======================================================

export const fetchPublicQuizzes = createAsyncThunk(
  "quiz/fetchPublicQuizzes",

  async (_, thunkAPI) => {
    try {
      const quizQuery = query(
        collection(db, "quizzes"),
        where("visibility", "==", "public")
      );

      const snapshot = await getDocs(quizQuery);

      const quizzes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return quizzes;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to fetch public quizzes"
      );
    }
  }
);

// ======================================================
// FETCH PRIVATE QUIZ USING PIN
// ======================================================

export const fetchPrivateQuiz = createAsyncThunk(
  "quiz/fetchPrivateQuiz",

  async (pin, thunkAPI) => {
    try {
      // Convert PIN to string
      const cleanPin = String(pin).trim();

      // Validate 6 digit PIN
      if (!/^\d{6}$/.test(cleanPin)) {
        throw new Error(
          "Please enter a valid 6 digit PIN"
        );
      }

      // Search private quiz
      const quizQuery = query(
        collection(db, "quizzes"),
        where("visibility", "==", "private"),
        where("pin", "==", cleanPin)
      );

      const snapshot = await getDocs(quizQuery);

      // Quiz not found
      if (snapshot.empty) {
        throw new Error(
          "Quiz not found. Please check the PIN."
        );
      }

      // Get first quiz
      const quizDoc = snapshot.docs[0];

      return {
        id: quizDoc.id,
        ...quizDoc.data(),
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to find private quiz"
      );
    }
  }
);

// ======================================================
// QUIZ SLICE
// ======================================================

const quizSlice = createSlice({
  name: "quiz",

  initialState,

  reducers: {
    // ==================================================
    // SET QUIZ
    // ==================================================

    setQuiz: (state, action) => {
      state.quizId =
        action.payload.quizId ||
        action.payload.id ||
        "";

      state.title =
        action.payload.title || "";

      state.questions =
        action.payload.questions || [];

      state.visibility =
        action.payload.visibility || "public";

      state.pin =
        action.payload.pin || "";
    },

    // ==================================================
    // ADD QUESTION
    // ==================================================

    addQuestion: (state, action) => {
      state.questions.push(action.payload);
    },

    // ==================================================
    // REMOVE QUESTION
    // ==================================================

    removeQuestion: (state, action) => {
      state.questions.splice(action.payload, 1);
    },

    // ==================================================
    // CLEAR QUIZ
    // ==================================================

    clearQuiz: (state) => {
      state.quizId = "";
      state.title = "";
      state.questions = [];
      state.source = null;
      state.error = null;
    },
  },

  // ====================================================
  // ASYNC REDUCERS
  // ====================================================

  extraReducers: (builder) => {
    // ==================================================
    // FETCH QUESTIONS
    // ==================================================

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

// ======================================================
// EXPORT ACTIONS
// ======================================================

export const {
  setQuiz,
  addQuestion,
  removeQuestion,
  clearQuiz,
  clearQuizError,
  setCurrentQuiz,
} = quizSlice.actions;

// ======================================================
// EXPORT REDUCER
// ======================================================

export default quizSlice.reducer;