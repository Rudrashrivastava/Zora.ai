import { io } from "socket.io-client";


let socket = null;


export const initializeSocketConnection = () => {

    if (socket) {
        return socket;
    }


    socket = io(
        "http://localhost:8000",
        {
            withCredentials: true,
        }
    );


    socket.on("connect", () => {

        console.log(
            "Connected to Socket.IO server:",
            socket.id
        );

    });


    socket.on("disconnect", () => {

        console.log(
            "Disconnected from Socket.IO server"
        );

    });


    return socket;

};