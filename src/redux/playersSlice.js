import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  players: [],
};

const playersSlice = createSlice({
  name: "players",

  initialState,

  reducers: {
    setPlayers: (state, action) => {
      state.players = action.payload;
    },

    addPlayer: (state, action) => {
      state.players.push(action.payload);
    },

    updatePlayer: (state, action) => {
      const { id, data } = action.payload;

      const player = state.players.find(
        (player) => player.id === id
      );

      if (player) {
        Object.assign(player, data);
      }
    },

    removePlayer: (state, action) => {
      state.players = state.players.filter(
        (player) => player.id !== action.payload
      );
    },

    updateScore: (state, action) => {
      const { id, points } = action.payload;

      const player = state.players.find(
        (player) => player.id === id
      );

      if (player) {
        player.score += points;
      }
    },

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
  clearPlayers,
} = playersSlice.actions;

export default playersSlice.reducer;