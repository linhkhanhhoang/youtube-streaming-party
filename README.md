# youtube-streaming-party

## Getting Started

Follow these instructions to run the client and server locally.

### 1. Setting Up the React Client

   ```
   cd client/streaming-client
   npm install react-router-dom
   npm install react-youtube
   npm install @reduxjs/toolkit
   npm install react-redux
   npm install --save redux-socket.io
   npm install socket.io-client
   npm install
   
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
