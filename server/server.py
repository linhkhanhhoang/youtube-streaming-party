import socket
import threading

rooms = {}  # Dictionary to store rooms and their connected clients
lock = threading.Lock()  # To handle concurrent access to rooms

def handle_client(conn, addr):
    print(f"New connection from {addr}")
    room = None  # Room the client is connected to

    try:
        while True:
            message = conn.recv(1024).decode().strip()
            if not message:
                break

            command = message.split(" ", 1)
            action = command[0].upper()

            if action == "CREATE" and len(command) > 1:
                room_id = command[1]
                with lock:
                    if room_id not in rooms:
                        rooms[room_id] = []
                    rooms[room_id].append(conn)
                room = room_id
                conn.send(f"Room '{room_id}' created and joined.\n".encode())

            elif action == "JOIN" and len(command) > 1:
                room_id = command[1]
                with lock:
                    if room_id in rooms:
                        rooms[room_id].append(conn)
                        room = room_id
                        conn.send(f"Joined room '{room_id}'.\n".encode())
                    else:
                        conn.send(f"Room '{room_id}' does not exist.\n".encode())

            elif action == "MSG" and room and len(command) > 1:
                msg = command[1]
                with lock:
                    for client in rooms.get(room, []):
                        if client != conn:
                            client.send(f"{addr}: {msg}\n".encode())

            elif action == "EXIT":
                break

            else:
                conn.send("Invalid command. Use CREATE, JOIN, or MSG.\n".encode())

    except Exception as e:
        print(f"Error with {addr}: {e}")

    finally:
        if room:
            with lock:
                if conn in rooms.get(room, []):
                    rooms[room].remove(conn)
                if not rooms[room]:  # Remove empty rooms
                    del rooms[room]
        conn.close()
        print(f"Connection from {addr} closed.")

def server_program():
    host = socket.gethostname()
    port = 5000

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen()

    print("Server started...")
    while True:
        conn, addr = server_socket.accept()
        thread = threading.Thread(target=handle_client, args=(conn, addr))
        thread.start()
        print(f"Active connections: {threading.active_count() - 1}")

if __name__ == '__main__':
    server_program()
