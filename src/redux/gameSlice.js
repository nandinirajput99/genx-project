import { createSlice } from "@reduxjs/toolkit";
<<<<<<< HEAD
=======

// ======================================================
// INITIAL STATE
// ======================================================

>>>>>>> 060ce249aac318f36c86d42b3e91e5e77170aa9b
const initialState = {
  // Live game information
  gameId: "",
  pin: "",
  quizId: "",

  // Game status
  // waiting → playing → finished
  status: "waiting",

  // Current question
  currentQuestionIndex: 0,

  // Question timer
  questionStartedAt: null,
  questionDuration: 30,
  timeLimit: 30,
  timeLeft: 30,

  // Answer state
  selectedAnswer: null,
  hasAnswered: false,
  answerRevealed: false,

  // Current player's score
  correctAnswers: 0,
  wrongAnswers: 0,

  // Leaderboard
  leaderboard: [],
};

// ======================================================
// GAME SLICE
// ======================================================

const gameSlice = createSlice({
  name: "game",

  initialState,

  reducers: {
    // ==================================================
    // SET COMPLETE GAME
    // ==================================================

    setGame: (state, action) => {
      Object.assign(state, action.payload);
    },

    // ==================================================
    // SET GAME STATUS
    // ==================================================

    setGameStatus: (state, action) => {
      state.status = action.payload;
    },

    // ==================================================
    // SET CURRENT QUESTION
    // ==================================================

    setCurrentQuestionIndex: (state, action) => {
      state.currentQuestionIndex = action.payload;

      // Reset answer state for new question
      state.selectedAnswer = null;
      state.hasAnswered = false;
      state.answerRevealed = false;

      // Reset timer
      state.timeLeft =
        state.questionDuration || state.timeLimit;
    },

    // ==================================================
    // QUESTION START TIME
    // ==================================================

    setQuestionStartedAt: (state, action) => {
      state.questionStartedAt = action.payload;
    },

    // ==================================================
    // SET QUESTION DURATION
    // ==================================================

    setQuestionDuration: (state, action) => {
      state.questionDuration = action.payload;
      state.timeLimit = action.payload;
      state.timeLeft = action.payload;
    },

    // ==================================================
    // SET TIME LIMIT
    // ==================================================

    setTimeLimit: (state, action) => {
      state.timeLimit = action.payload;
      state.questionDuration = action.payload;
      state.timeLeft = action.payload;
    },

    // ==================================================
    // UPDATE TIME LEFT
    // ==================================================

    setTimeLeft: (state, action) => {
      state.timeLeft = Math.max(0, action.payload);
    },

    // ==================================================
    // SELECT ANSWER
    // ==================================================

    setSelectedAnswer: (state, action) => {
      state.selectedAnswer = action.payload;
      state.hasAnswered = true;
    },

    // ==================================================
    // MARK ANSWER AS REVEALED
    // ==================================================

    setAnswerRevealed: (state, action) => {
      state.answerRevealed = action.payload;
    },

    // ==================================================
    // CORRECT ANSWER
    // ==================================================

    incrementCorrect: (state) => {
      state.correctAnswers += 1;
    },

    // ==================================================
    // WRONG ANSWER
    // ==================================================

    incrementWrong: (state) => {
      state.wrongAnswers += 1;
    },

    // ==================================================
    // SET LEADERBOARD
    // ==================================================

    setLeaderboard: (state, action) => {
      state.leaderboard = action.payload;
    },

    // ==================================================
    // RESET ANSWER
    // ==================================================

    resetAnswer: (state) => {
      state.selectedAnswer = null;
      state.hasAnswered = false;
      state.answerRevealed = false;
    },

    // ==================================================
    // RESET GAME
    // ==================================================

    resetGame: () => {
      return initialState;
    },
  },
});

<<<<<<< HEAD
=======
// ======================================================
// EXPORT ACTIONS
// ======================================================

>>>>>>> 060ce249aac318f36c86d42b3e91e5e77170aa9b
export const {
  setGame,
  setGameStatus,
  setCurrentQuestionIndex,
  setQuestionStartedAt,
  setQuestionDuration,
  setTimeLimit,
  setTimeLeft,
  setSelectedAnswer,
  setAnswerRevealed,
  incrementCorrect,
  incrementWrong,
  setLeaderboard,
  resetAnswer,
  resetGame,
} = gameSlice.actions;

// ======================================================
// EXPORT REDUCER
// ======================================================

export default gameSlice.reducer;