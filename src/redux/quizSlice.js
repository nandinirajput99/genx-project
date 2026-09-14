import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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
};

// ======================================================
// FETCH QUESTIONS FROM TRIVIA API
// ======================================================

export const fetchQuestions = createAsyncThunk(
  "quiz/fetchQuestions",

  async (_, thunkAPI) => {
    try {
      const response = await fetch(
        "https://the-trivia-api.com/v2/questions?limit=10"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to fetch questions"
      );
    }
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

      state.visibility = "public";
      state.pin = "";

      state.currentQuiz = null;
      state.createdQuiz = null;

      state.error = null;
    },

    // ==================================================
    // CLEAR ERROR
    // ==================================================

    clearQuizError: (state) => {
      state.error = null;
    },

    // ==================================================
    // SET CURRENT QUIZ
    // ==================================================

    setCurrentQuiz: (state, action) => {
      const quiz = action.payload;

      state.currentQuiz = quiz;

      state.quizId = quiz.id || "";
      state.title = quiz.title || "";
      state.questions = quiz.questions || [];

      state.visibility =
        quiz.visibility || "public";

      state.pin = quiz.pin || "";
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
        state.questions = action.payload;
      })

      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload ||
          action.error.message ||
          "Failed to fetch questions";
      });

    // ==================================================
    // CREATE QUIZ
    // ==================================================

    builder
      .addCase(createQuiz.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(createQuiz.fulfilled, (state, action) => {
        state.loading = false;

        // Store created quiz
        state.createdQuiz = action.payload;

        // Make it current quiz
        state.currentQuiz = action.payload;

        // Update main quiz state
        state.quizId = action.payload.id;
        state.title = action.payload.title;
        state.questions = action.payload.questions;
        state.visibility = action.payload.visibility;
        state.pin = action.payload.pin || "";
      })

      .addCase(createQuiz.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload ||
          action.error.message ||
          "Failed to create quiz";
      });

    // ==================================================
    // FETCH PUBLIC QUIZZES
    // ==================================================

    builder
      .addCase(fetchPublicQuizzes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPublicQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        state.publicQuizzes = action.payload;
      })

      .addCase(fetchPublicQuizzes.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload ||
          action.error.message ||
          "Failed to fetch public quizzes";
      });

    // ==================================================
    // FETCH PRIVATE QUIZ
    // ==================================================

    builder
      .addCase(fetchPrivateQuiz.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPrivateQuiz.fulfilled, (state, action) => {
        state.loading = false;

        // Store selected quiz
        state.currentQuiz = action.payload;

        // Update main quiz state
        state.quizId = action.payload.id;
        state.title = action.payload.title;
        state.questions =
          action.payload.questions || [];

        state.visibility =
          action.payload.visibility || "private";

        state.pin =
          action.payload.pin || "";
      })

      .addCase(fetchPrivateQuiz.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload ||
          action.error.message ||
          "Failed to find private quiz";
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