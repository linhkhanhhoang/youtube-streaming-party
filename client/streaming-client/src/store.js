import { configureStore, createSlice } from "@reduxjs/toolkit";
import socket from "./socket";

/**
 * This file sets up the global state management for the app using Redux Toolkit.
 * 
 * Key Features:
 * - Uses a single `appSlice` to manage application state, including:
 *   - Room info, host status, messages, video ID, playback state, current time, system messages, and existing rooms.
 * - Includes custom `socketMiddleware` to intercept and emit WebSocket events 
 *   for all dispatched actions prefixed with `WS_TO_SERVER_`.
 * 
 * This allows components to dispatch actions as usual while automatically
 * sending relevant ones to the server over WebSockets for real-time sync.
 */
const socketMiddleware = (socket) => (store) => (next) => (action) => {
  if (action.type.startsWith('WS_TO_SERVER_')) {
    socket.emit(action.type, action);
  }
  return next(action);
};

const appSlice = createSlice({
  name: 'app',
  initialState: {
    room: "",
    isHost: false,
    messages: [],
    videoId: null,
    playerState: "paused",
    currentTime: 0,
    systemMessage: null,
    existingRooms: []
  },
  reducers: {
    setRoom: (state, action) => { state.room = action.payload },
    setIsHost: (state, action) => { state.isHost = action.payload },
    setMessages: (state, action) => { state.messages = action.payload },
    addMessage: (state, action) => { state.messages.push(action.payload) },
    setVideo: (state, action) => { state.videoId = action.payload },
    setPlayerState: (state, action) => { state.playerState = action.payload },
    setPlayerTime: (state, action) => { state.currentTime = action.payload },
    setSystemMessage: (state, action) => { state.systemMessage = action.payload },
    setExistingRooms: (state, action) => { state.existingRooms = action.payload }
  }
});

export const {
  setRoom,
  setIsHost,
  setMessages,
  addMessage,
  setVideo,
  setPlayerState,
  setPlayerTime,
  setSystemMessage,
  setExistingRooms
} = appSlice.actions;

const store = configureStore({
  reducer: appSlice.reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(socketMiddleware(socket)),
});

export default store;
