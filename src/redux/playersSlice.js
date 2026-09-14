import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  players: [],
};

const playersSlice = createSlice({
  name: "players",

  initialState,

  reducers: {
    // Replace complete players list
    setPlayers: (state, action) => {
      state.players = action.payload;
    },

    // Add a new player
    addPlayer: (state, action) => {
      const player = action.payload;

      const exists = state.players.some(
        (existingPlayer) => existingPlayer.id === player.id
      );

      if (!exists) {
        state.players.push({
          ...player,

          score: player.score ?? 0,
          streak: player.streak ?? 0,
          bestStreak: player.bestStreak ?? 0,

          answered: player.answered ?? false,

          correctAnswers: player.correctAnswers ?? 0,
          wrongAnswers: player.wrongAnswers ?? 0,
        });
      }
    },

    // Update any information of a player
    updatePlayer: (state, action) => {
      const { id, data } = action.payload;

      const player = state.players.find(
        (player) => player.id === id
      );

      if (player) {
        Object.assign(player, data);
      }
    },

    // Remove player
    removePlayer: (state, action) => {
      state.players = state.players.filter(
        (player) => player.id !== action.payload
      );
    },

    // Add points to player's score
    updateScore: (state, action) => {
      const { id, points } = action.payload;

      const player = state.players.find(
        (player) => player.id === id
      );

      if (player) {
        player.score += points;
      }
    },

    // Update current streak
    updateStreak: (state, action) => {
      const { id, streak } = action.payload;

      const player = state.players.find(
        (player) => player.id === id
      );

      if (player) {
        player.streak = streak;

        if (streak > player.bestStreak) {
          player.bestStreak = streak;
        }
      }
    },

    // Reset answer status before next question
    resetPlayerAnswers: (state) => {
      state.players.forEach((player) => {
        player.answered = false;
      });
    },

    // Clear all players
    clearPlayers: (state) => {
      state.players = [];
    },
  },
});

export const {
  setPlayers,
  addPlayer,
  updatePlayer,
  removePlayer,
  updateScore,
  updateStreak,
  resetPlayerAnswers,
  clearPlayers,
} = playersSlice.actions;

export default playersSlice.reducer;