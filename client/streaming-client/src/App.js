import React, { useState, useEffect } from "react";

const App = () => {
  const [ws, setWs] = useState(null);
  const [room, setRoom] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.system) {
          setMessages((prev) => [...prev, { system: data.system }]);
        } else {
          setMessages((prev) => [...prev, { sender: data.sender, text: data.message }]);
        }
      };

      ws.onclose = () => {
        setConnected(false);
      };
    }
  }, [ws]);

  const connectToServer = () => {
    const websocket = new WebSocket("ws://localhost:5000");
    websocket.onopen = () => setConnected(true);
    setWs(websocket);
  };

  const createRoom = () => {
    if (ws && newRoom) {
      ws.send(JSON.stringify({ action: "CREATE", room_id: newRoom }));
    }
  };

  const joinRoom = () => {
    if (ws && room) {
      ws.send(JSON.stringify({ action: "JOIN", room_id: room }));
    }
  };

  const sendMessage = () => {
    if (ws && message) {
      ws.send(JSON.stringify({ action: "MSG", room_id: room, message }));
      setMessage("");
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
        </>
      )}
    </div>
  );
};

export default App;
