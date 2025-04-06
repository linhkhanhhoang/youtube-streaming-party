import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import YouTube from "react-youtube";

const App = () => {
  const [ws, setWs] = useState(null);
  const [room, setRoom] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [player, setPlayer] = useState(null);
  const params = useParams();
  const currentRoomFromURL = params.roomId;
  const isHostFromURL = new URLSearchParams(window.location.search).get("host") === "true";


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
        }

        if (data.type === "SET_VIDEO") {
          setVideoId(data.video_id);
        }

        if (data.type === "PLAY" && player) {
          player.playVideo();
        }

        if (data.type === "PAUSE" && player) {
          player.pauseVideo();
        }
      };

      ws.onclose = () => {
        setConnected(false);
      };
    }
  }, [ws, player]);

  useEffect(() => {
    if (currentRoomFromURL && !ws) {
      const websocket = new WebSocket("ws://localhost:5000");
      websocket.onopen = () => {
        setConnected(true);
        setWs(websocket);
        websocket.send(JSON.stringify({ action: "JOIN", room_id: currentRoomFromURL }));
        setIsHost(isHostFromURL); // joining means not the host
      };
    }
  }, [currentRoomFromURL, ws]);

  const extractYouTubeID = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url; // fallback to raw ID if it's already clean
  };

  const connectToServer = () => {
    const websocket = new WebSocket("ws://localhost:5000");
    websocket.onopen = () => setConnected(true);
    setWs(websocket);
  };

  const createRoom = () => {
    if (ws && newRoom.trim()) {
      ws.send(JSON.stringify({ action: "CREATE", room_id: newRoom.trim() }));

      setRoom(newRoom.trim());
      window.open(`/room/${newRoom.trim()}?host=true`, "_blank");
    } else {
      alert("Please enter a room name.");
    }
  };

  const joinRoom = () => {
    if (ws && room.trim()) {
      ws.send(JSON.stringify({ action: "JOIN", room_id: room.trim() }));
      setRoom(room.trim());
      window.open(`/room/${room.trim()}`, "_blank");

    } else {
      alert("Please enter a room name.");
    }
  };

  const sendMessage = () => {
    if (ws && message) {
      ws.send(JSON.stringify({ action: "MSG", room_id: room || currentRoomFromURL, message }));
      setMessage("");
    }
  };

  const onPlayerStateChange = (event) => {
    if (!isHost || !ws) return;
    const roomId = currentRoomFromURL || room;

    if (event.data === 1) {
      ws.send(JSON.stringify({ action: "PLAY", room_id: roomId }));
    } else if (event.data === 2) {
      ws.send(JSON.stringify({ action: "PAUSE", room_id: roomId }));
    }
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

          {/* Host sets YouTube video */}
          {isHost && currentRoomFromURL && (
            <div style={{ marginTop: "20px" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.target.elements.videoId;
                  const rawInput = input.value.trim();
                  const videoIdValue = extractYouTubeID(rawInput);
                  if (videoIdValue && ws) {
                    ws.send(JSON.stringify({
                      action: "SET_VIDEO",
                      room_id: currentRoomFromURL,
                      video_id: videoIdValue
                    }));
                    input.value = ""; // clear input after submit
                  }
                }}
              >
              <input
                type="text"
                name="videoId"
                placeholder="Enter YouTube Video ID"
              />
              <button type="submit">Set Video</button>
            </form>
          </div>
        )}


          {/* YouTube video player */}
          {currentRoomFromURL && videoId && (
            <div style={{ marginTop: "30px" }}>
              <h3>Now Watching in Room: {currentRoomFromURL}</h3>
              <YouTube
                videoId={videoId}
                onReady={(event) => setPlayer(event.target)}
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
