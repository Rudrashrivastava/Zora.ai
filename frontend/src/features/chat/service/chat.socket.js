import { io } from "socket.io-client";


let socket = null;


export const initializeSocketConnection = () => {

    if (socket) {
        return socket;
    }


    const socketUrl = import.meta.env.VITE_BACKEND_URL || (() => {
        if (typeof window === "undefined") return "http://localhost:8000";
        const { hostname, protocol } = window.location;
        if (hostname === "localhost" || hostname === "127.0.0.1" || /^192\.168\./.test(hostname) || /^10\./.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
            return `${protocol}//${hostname}:8000`;
        }
        return window.location.origin;
    })();

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