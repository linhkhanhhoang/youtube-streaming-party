import asyncio
import websockets
import json

rooms = {}

async def handle_client(websocket):
    room = None
    try:
        async for message in websocket:
            data = json.loads(message)
            action = data.get("action")
            room_id = data.get("room_id")
            text = data.get("message")

            if action == "CREATE" or action == "JOIN":
                if room_id not in rooms:
                    rooms[room_id] = set()
                rooms[room_id].add(websocket)
                room = room_id
                await websocket.send(json.dumps({"system": f"Joined room '{room_id}'"}))

            elif action == "MSG" and room and text:
                if room in rooms:
                    broadcast_message = json.dumps({"sender": "User", "message": text})
                    await asyncio.gather(*(ws.send(broadcast_message) for ws in rooms[room] if ws != websocket))

            elif action == "EXIT":
                break

    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        if room and websocket in rooms.get(room, set()):
            rooms[room].remove(websocket)
            if not rooms[room]:
                del rooms[room]
        await websocket.close()

async def server():
    async with websockets.serve(handle_client, "localhost", 5000):
        print("Server started on ws://localhost:5000")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(server())
