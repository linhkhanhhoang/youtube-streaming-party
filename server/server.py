import asyncio
import json
import re
from aiohttp import web
import socketio

"""
This server manages real-time room-based communication for the YouTube group watch app.

Built with:
- `aiohttp` for the web server
- `python-socketio` for asynchronous WebSocket communication

Core Features:
- Handles room creation and joining (with host/client distinction)
- Stores and synchronizes video state (video ID, playback status, time)
- Relays chat messages between users in the same room
- Ensures non-hosts sync with the host's video on join
- Emits structured Redux-compatible actions back to clients for store updates
"""
sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

YOUTUBE_VIDEO_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{11}$')

rooms = {}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    for room_id, room_data in list(rooms.items()):
        if sid in room_data["clients"]:
            room_data["clients"].remove(sid)
            
            if sid == room_data["host"]:
                for client_sid in room_data["clients"]:
                    await sio.emit("action", {"type": "SET_SYSTEM_MESSAGE", "payload": "Host ended the session"}, room=client_sid)
                del rooms[room_id]
            elif not room_data["clients"]:
                del rooms[room_id]

@sio.on("WS_TO_SERVER_CREATE_ROOM")
async def create_room(sid, data):
    room_id = data.get("payload", {}).get("room_id")
    
    if not room_id:
        await sio.emit("action", {"type": "SET_SYSTEM_MESSAGE", "payload": "Invalid room name"}, room=sid)
        return
        
    if room_id in rooms:
        await sio.emit("action", {"type": "SET_SYSTEM_MESSAGE", "payload": f"Room '{room_id}' already exists"}, room=sid)
    else:
        rooms[room_id] = {
            "host": sid,
            "clients": [sid],
            "video_id": None,
            "player_state": "paused",
            "current_time": 0
        }
        
        await sio.enter_room(sid, room_id)
        await sio.emit("action", {"type": "SET_SYSTEM_MESSAGE", "payload": f"Created and joined room '{room_id}' as host"}, room=sid)

@sio.on("WS_TO_SERVER_JOIN_ROOM")
async def join_room(sid, data):
    room_id = data.get("payload", {}).get("room_id")
    
    if not room_id:
        await sio.emit("action", {"type": "SET_SYSTEM_MESSAGE", "payload": "Invalid room name"}, room=sid)
        return
        
    if room_id not in rooms:
        await sio.emit("action", {"type": "SET_SYSTEM_MESSAGE", "payload": f"Room '{room_id}' does not exist"}, room=sid)
    else:
        if sid not in rooms[room_id]["clients"]:
            rooms[room_id]["clients"].append(sid)
            await sio.enter_room(sid, room_id)
            await sio.emit("action", {"type": "SET_SYSTEM_MESSAGE", "payload": f"Joined room '{room_id}'"}, room=sid)
            print("joined room from", sid, rooms)
            video_id = rooms[room_id]["video_id"]
            player_state = rooms[room_id]["player_state"]
            current_time = rooms[room_id]["current_time"]
            
            if video_id:
                await sio.emit("action", {"type": "SET_VIDEO", "payload": video_id}, room=sid)
                await sio.emit("action", {"type": "SET_PLAYER_STATE", "payload": player_state}, room=sid)
                await sio.emit("action", {"type": "SET_PLAYER_TIME", "payload": current_time}, room=sid)

@sio.on("WS_TO_SERVER_SEND_MESSAGE")
async def send_message(sid, data):
    payload = data.get("payload", {})
    room_id = payload.get("room_id")
    message = payload.get("message")
    
    if room_id and message and room_id in rooms:
        # sender = "Host" if sid == rooms[room_id]["host"] else "User"

        for client_sid in rooms[room_id]["clients"]:
            if client_sid != sid:
                await sio.emit("action", {
                    "type": "ADD_MESSAGE", 
                    "payload": {"sender": client_sid, "message": message}
                }, room=client_sid)
        
        await sio.emit("action", {
            "type": "ADD_MESSAGE", 
            "payload": {"sender": "You", "message": message}
        }, room=sid)

@sio.on("WS_TO_SERVER_SET_VIDEO")
async def set_video(sid, data):
    payload = data.get("payload", {})
    room_id = payload.get("room_id")
    video_id = payload.get("video_id")
    # print(f"Request to set video in room {room_id} by user {sid}. Host is {rooms[room_id]['host']}.")
    if room_id in rooms:
        if not video_id or not YOUTUBE_VIDEO_ID_PATTERN.match(video_id):
            await sio.emit("action", {"type": "SET_SYSTEM_MESSAGE", "payload": "Invalid YouTube Video ID"}, room=sid)
        else:
            rooms[room_id]["video_id"] = video_id
            rooms[room_id]["player_state"] = "paused"
            rooms[room_id]["current_time"] = 0
            for client_sid in rooms[room_id]["clients"]:
                await sio.emit("action", {"type": "SET_VIDEO", "payload": video_id}, room=client_sid)
                await sio.emit("action", {"type": "SET_PLAYER_STATE", "payload": "paused"}, room=client_sid)
                await sio.emit("action", {"type": "SET_PLAYER_TIME", "payload": 0}, room=client_sid)
                print(rooms)
    else:
        await sio.emit("action", {"type": "SET_SYSTEM_MESSAGE", "payload": "Only the host can set videos"}, room=sid)

@sio.on("WS_TO_SERVER_PLAYER_ACTION")
async def player_action(sid, data):
    payload = data.get("payload", {})
    room_id = payload.get("room_id")
    action = payload.get("action")
    time = payload.get("time", 0)
    
    if room_id in rooms and room_id and action:
        rooms[room_id]["player_state"] = action
        rooms[room_id]["current_time"] = time
        print("set player_action for", sid, rooms)

        for client_sid in rooms[room_id]["clients"]:
            if client_sid != sid:
                print("set player_action for", client_sid, rooms)
                await sio.emit("action", {"type": "SET_PLAYER_STATE", "payload": action}, room=client_sid)
                if action == "playing" or action == "paused":
                    await sio.emit("action", {"type": "SET_PLAYER_TIME", "payload": time}, room=client_sid)

if __name__ == "__main__":
    web.run_app(app, host='localhost', port=5000)
