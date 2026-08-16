export const selectQuestions = (state) =>
  state.quiz.questions;

export const selectGameStatus = (state) =>
  state.game.status;

export const selectPlayers = (state) =>
  state.players.players;

export const selectCurrentQuestionIndex = (state) =>
  state.game.currentQuestionIndex;

export const selectLeaderboard = (state) =>
  [...state.player.players].sort(
    (a, b) => b.score - a.score
  );