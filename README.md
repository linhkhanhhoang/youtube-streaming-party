# youtube-streaming-party

FEATURES:
- Server: youtube streaming, user actions (pause, play,...), room management, user chat, store room IDs
- User: pick videos, chat, user actions (pause, play,...), join room, create room, login (?)

Step 1: create a server => find a way for users to connect to the server (Linh)
Step 2: Create room function, join room (Evelyn)
Step 3: Add youtube => find a way to manage user actions
Step 4: Chat
Step 5: Front end


---

## Getting Started

Follow these instructions to run the client and server locally.

### 1. Setting Up the React Client

   ```
   cd client/streaming-client
   npm install
   npm start
   ```

### 2. Setting Up the Python WebSocket Server

    ```
    cd server
    python3 -m venv venv
    source venv/bin/activate
    pip install websockets
    python3 server.py
    ```
