import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    players: [],
};

const playerSlice = createSlice({
    name: "player",

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
    clearPlayers,
} = playerSlice.actions;

export default playerSlice.reducer;