import io from "socket.io-client";

/**
 * Creates and configures a singleton WebSocket connection using `socket.io-client`.
 * 
 * Configuration:
 * - Connects to the server at `http://localhost:5000`.
 * - Attempts to reconnect up to 5 times with a 1-second delay between tries.
 * - Times out after 20 seconds if the server doesn't respond.
 * - Enables automatic reconnection handling.
 * 
 * This socket instance is shared across the entire app and used to emit or listen
 * to real-time events for video sync, room management, and chat.
 */
const socket = io("http://localhost:5000", {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  reconnection: true, 
});

console.log('Socket initialized:', socket.id);

export default socket;