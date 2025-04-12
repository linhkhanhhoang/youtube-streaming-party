import { configureStore, createSlice } from "@reduxjs/toolkit";
import socket from "./socket";

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
    systemMessage: null
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
} = appSlice.actions;

const store = configureStore({
  reducer: appSlice.reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(socketMiddleware(socket)),
});

export default store;
