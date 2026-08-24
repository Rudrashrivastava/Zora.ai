import { io } from "socket.io-client";


let socket = null;


export const initializeSocketConnection = () => {

    if (socket) {
        return socket;
    }


    const socketUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" ? window.location.origin : "http://localhost:8000");

    socket = io(
        socketUrl,
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