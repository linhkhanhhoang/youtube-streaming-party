import asyncio
import websockets
import json
import re

YOUTUBE_VIDEO_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{11}$')

rooms = {}

async def handle_client(websocket):
    room = None
    is_host = False

    try:
        async for message in websocket:
            data = json.loads(message)
            action = data.get("action")
            room_id = data.get("room_id")
            text = data.get("message")

            # === Create Room ===
            if action == "CREATE":
                if room_id in rooms:
                    await websocket.send(json.dumps({"system": f"Room '{room_id}' already exists"}))
                else:
                    rooms[room_id] = {
                        "host": websocket,
                        "clients": set([websocket]),
                        "video_id": None
                    }
                    room = room_id
                    is_host = True
                    await websocket.send(json.dumps({"system": f"Created and joined room '{room_id}' as host"}))

            # === Join Room ===
            elif action == "JOIN":
                if room_id not in rooms:
                    await websocket.send(json.dumps({"system": f"Room '{room_id}' does not exist"}))
                else:
                    rooms[room_id]["clients"].add(websocket)
                    room = room_id
                    await websocket.send(json.dumps({"system": f"Joined room '{room_id}'"}))

                    # Sync video on join
                    video_id = rooms[room_id]["video_id"]
                    if video_id:
                        await websocket.send(json.dumps({"type": "SET_VIDEO", "video_id": video_id}))

            # === Host sets video ===
            elif action == "SET_VIDEO" and room_id in rooms:
                video_id = data.get("video_id")
                if not video_id or not YOUTUBE_VIDEO_ID_PATTERN.match(video_id):
                    await websocket.send(json.dumps({"system": "Invalid YouTube Video ID"}))
                else:
                    rooms[room_id]["video_id"] = video_id
                    msg = json.dumps({"type": "SET_VIDEO", "video_id": video_id})
                    await asyncio.gather(*(ws.send(msg) for ws in rooms[room_id]["clients"]))

            # === Host controls playback ===
            elif action in ["PLAY", "PAUSE"] and is_host and room in rooms:
                msg = json.dumps({"type": action})
                await asyncio.gather(*(ws.send(msg) for ws in rooms[room]["clients"] if ws != websocket))

            # === Chat message ===
            elif action == "MSG" and room and text:
                if room in rooms:
                    msg = json.dumps({"sender": "User", "message": text})
                    await asyncio.gather(*(ws.send(msg) for ws in rooms[room]["clients"] if ws != websocket))

            elif action == "EXIT":
                break

    except Exception as e:
        print(f"Error: {e}")

    finally:
        if room and room in rooms:
            clients = rooms[room]["clients"]
            clients.discard(websocket)

            if websocket == rooms[room]["host"]:
                for ws in clients:
                    await ws.send(json.dumps({"system": "Host ended the session"}))
                    await ws.close()
                del rooms[room]
            elif not clients:
                del rooms[room]

        await websocket.close()

async def server():
    async with websockets.serve(handle_client, "localhost", 5000):
        print("Server started on ws://localhost:5000")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(server())
