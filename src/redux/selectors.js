export const selectQuestions = (state) =>
  state.quiz?.questions || [];

export const selectGameStatus = (state) =>
  state.game?.status || "waiting";

export const selectPlayers = (state) =>
  state.players?.players || [];

export const selectCurrentQuestionIndex = (state) =>
  state.game?.currentQuestionIndex || 0;

export const selectLeaderboard = (state) =>
  [...(state.players?.players || [])].sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );