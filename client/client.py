import socket
import threading 

def receive_messages(client_socket):
    while True:
        try:
            message = client_socket.recv(1024).decode()
            if not message:
                break
            print(message)
        except:
            print("Disconnected from server.")
            break

def client_program():
    host = socket.gethostname()  # as both code is running on same pc
    port = 5000  # socket server port number

    client_socket = socket.socket() 
    try:
        client_socket.connect((host, port))  # connect to the server
        print("Connected to server. Commands: \nCREATE room_id\nJOIN room_id\nMSG message\nEXIT")
        threading.Thread(target=receive_messages, args=(client_socket,), daemon=True).start()
    except ConnectionRefusedError:
        print("The connection to the server was refused")
        return

    while True:
        message = input()
        if message.strip().upper() == "EXIT":
            client_socket.send("EXIT".encode())
            break
        client_socket.send(message.encode())

    client_socket.close()  # close the connection

if __name__ == '__main__':
    client_program()