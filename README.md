# youtube-streaming-party

A real-time group watch app where users can watch YouTube videos together, synced across all participants, with integrated chat support.

Built with:
- React + Redux (client)
- WebSockets using Socket.IO (server)
- Python (async backend with `aiohttp` and `python-socketio`)

---

## Getting Started

These instructions will help you set up both the client and server locally.

### 1. Setting Up the React Client

   ```
   cd client/streaming-client
   npm install
   npm install react-router-dom
   npm install react-youtube
   npm install @reduxjs/toolkit
   npm install react-redux
   npm install --save redux-socket.io
   npm install socket.io-client
   npm start
   ```

### 2. Setting Up the Python WebSocket Server

    ```
    cd server
    python3 -m venv venv
    source venv/bin/activate
    pip install websockets
    pip install aiohttp
    pip install python-socketio
    python3 server.py
    ```

---
## How It Works

- The host creates a room and controls playback.
- Other clients join the room and automatically sync to the host's video state (play, pause, seek).
- Messages and system events are sent and displayed in real time.
- State is managed via Redux, and WebSocket actions are handled through middleware.

## Project Structure
```
project-root/
│
├── client/
│   └── streaming-client/
│       ├── components/
│       ├── App.js
│       ├── Home.js
│       ├── Room.js
│       ├── index.js
│       ├── store.js
│       └── socket.js
│
├── server/                
│   └── server.py
```

## Authors

Developed for COMP 352 by Linh Hoang & Evelyn Pham
