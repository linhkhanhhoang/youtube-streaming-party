import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import YouTube from "react-youtube";


const App = () => {
  const [ws, setWs] = useState(null);
  const [room, setRoom] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const params = useParams();
  const currentRoomFromURL = params.roomId;

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.system) {
          setMessages((prev) => {
            const lastMessage = prev.length > 0 ? prev[prev.length - 1].system : null;
            if (lastMessage !== data.system) {
              return [...prev, { system: data.system }];
            }
            return prev;
          });        
        } else {
          setMessages((prev) => [...prev, { sender: data.sender, text: data.message }]);
        }
      };

      ws.onclose = () => {
        setConnected(false);
      };
    }
  }, [ws]);

  useEffect(() => {
    if (currentRoomFromURL && !ws) {
      const websocket = new WebSocket("ws://localhost:5000");
      websocket.onopen = () => {
        setConnected(true);
        setWs(websocket);
        websocket.send(JSON.stringify({ action: "JOIN", room_id: currentRoomFromURL }));
      };
    }
  }, [currentRoomFromURL, ws]);  

  const connectToServer = () => {
    const websocket = new WebSocket("ws://localhost:5000");
    websocket.onopen = () => setConnected(true);
    setWs(websocket);
  };

  const createRoom = () => {
    if (ws && newRoom) {
      ws.send(JSON.stringify({ action: "CREATE", room_id: newRoom }));
      setRoom(newRoom);
      setInRoom(true);
      window.open(`/room/${newRoom}`, "_blank");
    }
  };
  
  const joinRoom = () => {
    if (ws && room) {
      ws.send(JSON.stringify({ action: "JOIN", room_id: room }));
      setInRoom(true);
      window.open(`/room/${room}`, "_blank");
    }
  };
  

  const sendMessage = () => {
    if (ws && message) {
      ws.send(JSON.stringify({ action: "MSG", room_id: room, message }));
      setMessage("");
    }
  };

  // 👇 NEW: YouTube player handlers
  const onPlayerReady = (event) => {
    console.log("YouTube Player is ready.");
  };

  const onPlayerStateChange = (event) => {
    // 1: Playing, 2: Paused
    console.log("Player state:", event.data);
    // TODO: Send play/pause state to server for syncing
  };

  return (
    <div className="app">
      {!connected ? (
        <button onClick={connectToServer}>Connect to Server</button>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter room name"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>

          <input
            type="text"
            placeholder="Enter room name"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
          />
          <button onClick={createRoom}>Create Room</button>

          <div className="chat-box">
            {messages.map((msg, index) =>
              msg.system ? (
                <p key={index} className="system">{msg.system}</p>
              ) : (
                <p key={index}>
                  <strong>{msg.sender}:</strong> {msg.text}
                </p>
              )
            )}
          </div>

          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>

          {/* This shows only if URL is /room/:roomId */}
          {currentRoomFromURL && (
            <div style={{ marginTop: "30px" }}>
              <h3>Now Watching in Room: {currentRoomFromURL}</h3>
              <YouTube
                videoId="dQw4w9WgXcQ"
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
