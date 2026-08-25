import { Server } from "socket.io";


let io;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: function (origin, callback) {
                return callback(null, true);
            },
            credentials: true,
        },
    });

    console.log("Socket.io server is RUNNING")

    io.on("connection", (socket) => {
        console.log("A user connected: " + socket.id)
    })
}

export function getIO() {
    if (!io) {
        throw new Error("Socket.io not initialized")
    }

    return io
}