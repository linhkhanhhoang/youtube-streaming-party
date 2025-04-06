import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import YouTube from "react-youtube";

const App = () => {
  const [ws, setWs] = useState(null);
  const [room, setRoom] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [requestVideoId, setRequestVideoId] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [player, setPlayer] = useState(null);
  const params = useParams();
  const currentRoomFromURL = params.roomId;
  const isHostFromURL = new URLSearchParams(window.location.search).get("host") === "true";

  useEffect(() => {
    if (!ws) {
      connectToServer();
    }
  }, [ws]);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.system) {
          console.log(data.system);
          if (data.system.includes("Created and joined")) {
            const roomId = data.system.match(/'(.+)'/)[1];
            window.open(`/room/${roomId}?host=true`, "_blank");
          }

          if (data.system.includes("Joined room")) {
            const roomId = data.system.match(/'(.+)'/)[1];
            window.open(`/room/${roomId}`, "_blank");
          }

          if (data.system.includes("already exists") || data.system.includes("does not exist")) {
            alert(data.system);
          }

          if (data.system.includes("Invalid Youtube Video ID")) {
            alert(data.system);
          }
        }

        if (data.type === "SET_VIDEO") {
          setVideoId(data.video_id);
          console.log(videoId);
        }

        // if (data.type === "PLAY" && player) {
        //   player.playVideo();
        // }

        // if (data.type === "PAUSE" && player) {
        //   player.pauseVideo();
        // }
      };

      ws.onclose = () => {
        console.log("WS is closed");
      };
    }
  }, [ws, player]);

  useEffect(() => {
  if (currentRoomFromURL && ws) {
    ws.send(JSON.stringify({ action: "JOIN", room_id: currentRoomFromURL }));
    setIsHost(isHostFromURL);
  }
  }, [currentRoomFromURL, ws]);

  const extractYouTubeID = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url; // fallback to raw ID if it's already clean
  };

  const connectToServer = () => {
    const websocket = new WebSocket("ws://localhost:5000");
    websocket.onopen = () => setWs(websocket);
    console.log(ws);
  };

  const createRoom = () => {
    if (ws && newRoom.trim()) {
      ws.send(JSON.stringify({ action: "CREATE", room_id: newRoom.trim() }));
      setNewRoom("");
    } else {
      alert("Please enter a room name.");
    }
  };

  const joinRoom = () => {
    if (ws && room.trim()) {
      ws.send(JSON.stringify({ action: "JOIN", room_id: room.trim() }));
      setRoom("");
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

  const requestVideo = () => {
    if (ws && requestVideoId) {
      const videoIdValue = extractYouTubeID(requestVideoId);
      ws.send(
        JSON.stringify({
          action: "SET_VIDEO",
          room_id: currentRoomFromURL,
          video_id: videoIdValue,
        })
      );
      setRequestVideoId("");
    } else {
      alert("Please enter a valid YouTube link.");
    }
  }

  // const onPlayerStateChange = (event) => {
  //   if (!isHost || !ws) return;
  //   const roomId = currentRoomFromURL || room;

  //   if (event.data === 1) {
  //     ws.send(JSON.stringify({ action: "PLAY", room_id: roomId }));
  //   } else if (event.data === 2) {
  //     ws.send(JSON.stringify({ action: "PAUSE", room_id: roomId }));
  //   }
  // };

  return (
    <div className="app">
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

          {isHost && currentRoomFromURL && (
            <div style={{ marginTop: "20px" }}>
             <input
              type="text"
              value={requestVideoId}
              onChange={(e) => setRequestVideoId(e.target.value)}
              placeholder="Enter YouTube Video Link"
              />
              <button onClick={requestVideo}>Set Video</button>
            </div>
          )}

          {currentRoomFromURL && videoId && (
            <div style={{ marginTop: "30px" }}>
              <h3>Now Watching in Room: {currentRoomFromURL}</h3>
              <YouTube
                videoId={videoId}
                // onReady={(event) => setPlayer(event.target)}
                // onStateChange={onPlayerStateChange}
              />
            </div>
          )}
        </>
    </div>
  );
};

export default App;
