import { Server } from "socket.io";
import { rooms } from "./roommanage.js";

function initializeSocket(server) {
    const io = new Server(server, {
        cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
        console.log("new connection:", socket.id);

        socket.on("create-room", ({ roomId, key }) => {
            rooms.set(roomId, {
                key,
                users: [socket.id],
                offererId: socket.id,
                answererId: null,
                offererReady: false,
                answererReady: false,
            });
            socket.join(roomId);
            console.log("Room Created:", roomId);
        });

        socket.on("join-room", ({ roomId, key }) => {
            const room = rooms.get(roomId);
            if (!room) { socket.emit("error", "Room Not found"); return; }
            if (room.key !== key) { socket.emit("error", "Invalid key"); return; }

            if (!room.users.includes(socket.id)) {
                room.users.push(socket.id);
            }
            room.answererId = socket.id;
            socket.join(roomId);
            io.to(roomId).emit("user-joined", room.users);
            console.log("user joined", socket.id, "in room", roomId);
        });

        // Room page pe wapas aane par socket room mein re-join (reconnect ke baad)
        socket.on("rejoin-room", ({ roomId, key }) => {
            const room = rooms.get(roomId);
            if (!room || room.key !== key) return;
            socket.join(roomId);
            if (!room.users.includes(socket.id)) {
                room.users.push(socket.id);
            }
        });

        function notifyOffererIfBothReady(room) {
            if (!room.offererReady || !room.answererReady || !room.offererId) return;
            const offererSocket = io.sockets.sockets.get(room.offererId);
            if (offererSocket) {
                offererSocket.emit("answerer-ready");
                console.log("Both peers ready — answerer-ready sent to offerer in", room);
            }
        }

        socket.on("offerer-ready", ({ roomId }) => {
            const room = rooms.get(roomId);
            if (!room || socket.id !== room.offererId) return;
            room.offererReady = true;
            console.log("Offerer ready in room:", roomId);
            notifyOffererIfBothReady(room);
        });

        socket.on("answerer-ready", ({ roomId }) => {
            const room = rooms.get(roomId);
            if (!room || socket.id !== room.answererId) return;
            room.answererReady = true;
            console.log("Answerer ready in room:", roomId);
            notifyOffererIfBothReady(room);
        });

        socket.on("offer", ({ roomId, offer }) => {
            socket.to(roomId).emit("offer", { offer, from: socket.id });
        });

        socket.on("answer", ({ roomId, answer }) => {
            socket.to(roomId).emit("answer", { answer, from: socket.id });
        });

        socket.on("ice-candidate", ({ roomId, candidate }) => {
            socket.to(roomId).emit("ice-candidate", { candidate, from: socket.id });
        });

        socket.on("disconnect", () => {
            rooms.forEach((room, roomId) => {
                if (!room.users.includes(socket.id)) return;

                room.users = room.users.filter(id => id !== socket.id);

                if (socket.id === room.offererId) {
                    room.offererId = null;
                    room.offererReady = false;
                }
                if (socket.id === room.answererId) {
                    room.answererId = null;
                    room.answererReady = false;
                }

                if (room.users.length === 0) {
                    rooms.delete(roomId);
                } else {
                    io.to(roomId).emit("peer-disconnected", socket.id);
                }
            });
            console.log("disconnected:", socket.id);
        });
    });

    return io;
}

export default initializeSocket;
