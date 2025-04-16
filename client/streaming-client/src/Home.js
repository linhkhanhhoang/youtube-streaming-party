import React, { useState, useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export const WS_TO_SERVER_JOIN_ROOM = "WS_TO_SERVER_JOIN_ROOM";
export const WS_TO_SERVER_CREATE_ROOM = "WS_TO_SERVER_CREATE_ROOM";
export const WS_TO_SERVER_SEND_MESSAGE = "WS_TO_SERVER_SEND_MESSAGE";
export const WS_TO_SERVER_SET_VIDEO = "WS_TO_SERVER_SET_VIDEO";
export const WS_TO_SERVER_PLAYER_ACTION = "WS_TO_SERVER_PLAYER_ACTION";

/**
 * This is the landing page for the YouTube Streaming Party app.
 * 
 * Responsibilities:
 * - Allows users to join an existing room or create a new room by name.
 * - Dispatches WebSocket actions to the server (`JOIN_ROOM` and `CREATE_ROOM`).
 * - Listens for `systemMessage` updates from the Redux store to determine room join success.
 * - Automatically redirects users to the appropriate `/room/:room_id` route upon success.
 * - Displays a system status message (e.g., success or error feedback from server).
 */
function Home() {
    const [room, setRoomInput] = useState("");
    const [newRoom, setNewRoom] = useState("");
    const dispatch = useDispatch();
    const systemMessage = useSelector(state => state.systemMessage);
    const navigate = useNavigate();
  
    const createRoom = () => {
      if (newRoom.trim()) {
        dispatch({ 
          type: WS_TO_SERVER_CREATE_ROOM, 
          payload: { room_id: newRoom.trim() } 
        });
        setNewRoom("");
      } else {
        alert("Please enter a room name.");
      }
    };
  
    const joinRoom = () => {
      if (room.trim()) {
        dispatch({ 
          type: WS_TO_SERVER_JOIN_ROOM, 
          payload: { room_id: room.trim() } 
        });
        setRoomInput("");
      } else {
        alert("Please enter a room name.");
      }
    };
  
    useEffect(() => {
      if (systemMessage && systemMessage.includes("Created and joined")) {
        const roomId = systemMessage.match(/'(.+)'/)[1];
        navigate(`/room/${roomId}?host=true`);
      }
  
      if (systemMessage && systemMessage.includes("Joined room")) {
        const roomId = systemMessage.match(/'(.+)'/)[1];
        navigate(`/room/${roomId}`);
      }
    }, [systemMessage, navigate]);
  
    return (
      <div className="home-container">
        
        <div className="room-section">
          <div className="room-box">
            <h2>Join a Room</h2>
            <input
              type="text"
              placeholder="Enter room name"
              value={room}
              onChange={(e) => setRoomInput(e.target.value)}
            />
            <button onClick={joinRoom}>Join Room</button>
          </div>

          <div className="room-box">
            <h2>Create a Room</h2>
            <input
              type="text"
              placeholder="Enter room name"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
            />
            <button onClick={createRoom}>Create Room</button>
          </div>
        </div>
  
        {systemMessage && (
          <div className="status-box">
            <p>{systemMessage}</p>
          </div>
        )}
      </div>
    );
}

export default Home;