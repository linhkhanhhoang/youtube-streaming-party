// App.js
import React, { useState, useEffect } from "react";
import { useParams, Outlet } from "react-router-dom";
import store from "./store";
import socket from './socket';
import {
  setVideo,
  setPlayerState,
  setPlayerTime,
  addMessage,
  setMessages,
  setSystemMessage,
} from "./store";

function App() {
  useEffect(() => {
    socket.on("action", (action) => {
      console.log('Received socket action:', action);
      if (action.type && action.payload !== undefined) {
        switch(action.type) {
          case "SET_VIDEO":
            console.log("passed frontend")
            store.dispatch(setVideo(action.payload));
            break;
          case "SET_PLAYER_STATE":
            console.log(action.payload);
            store.dispatch(setPlayerState(action.payload));
            break;
          case "SET_PLAYER_TIME":
            store.dispatch(setPlayerTime(action.payload));
            break;
          case "ADD_MESSAGE":
            store.dispatch(addMessage(action.payload));
            break;
          case "SET_MESSAGES":
            store.dispatch(setMessages(action.payload));
            break;
          case "SET_SYSTEM_MESSAGE":
            store.dispatch(setSystemMessage(action.payload));
            break;
          default:
            console.log("Unhandled action type:", action.type);
            break;
        }
      }
    });

    socket.on("connect", () => {
      console.log("Connected to socket server with ID:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      socket.off("action");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);
  return (
    <div className="app-layout">
      <header>
        <h1>Youtube Streaming Party</h1>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>COMP 352 by Linh & Evelyn</p>
      </footer>
    </div>
  );
}

export default App;