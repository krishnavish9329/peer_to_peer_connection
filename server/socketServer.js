import { Server } from "socket.io";
import { rooms } from "./roommanage.js";

function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "*"
        }
    })

    io.on("connection", (socket) => {
        console.log("new connection:", socket.id)

        socket.on("create-room", ({ roomId, key }) => {
            rooms.set(roomId, {
                key,
                users: [socket.id],
            })

            socket.join(roomId)
            console.log("Room Created");

        })
        socket.on("join-room", ({ roomId, key }) => {
            const room = rooms.get(roomId)

            if (!room) {
                socket.emit("error", "Room Not found")
                return;
            }
            if (room.key !== key) {
                socket.emit("error", "invalid key")
                return;
            }
            room.users.push(socket.id);
            socket.join(roomId);
            io.to(roomId).emit(
                "user-joined", room.users
            );
            console.log("user joined", socket.id, "in room", roomId);
        })
    })
    return io;
}
// module.exports = initializeSocket;

export default initializeSocket;