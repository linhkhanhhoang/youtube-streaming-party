import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  reconnection: true, 
});

console.log('Socket initialized:', socket.id); // Add this line

export default socket;