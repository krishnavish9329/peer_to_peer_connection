// import { Server } from "socket.io";
// import { rooms } from "./roommanage.js";

// function initializeSocket(server) {
//     const io = new Server(server, {
//         cors: {
//             origin: "*"
//         }
//     })

//     io.on("connection", (socket) => {
//         console.log("new connection:", socket.id)

//         //create Room

//         socket.on("create-room", ({ roomId, key }) => {
//             rooms.set(roomId, {
//                 key,
//                 users: [socket.id],
//             })

//             socket.join(roomId)
//             console.log("Room Created", rooms);

//         })
//         //Join Room
//         socket.on("join-room", ({ roomId, key }) => {
//             const room = rooms.get(roomId)

//             if (!room) {
//                 socket.emit("error", "Room Not found")
//                 return;
//             }
//             if (room.key !== key) {
//                 socket.emit("error", "invalid key")
//                 return;
//             }
//             room.users.push(socket.id);
//             socket.join(roomId);
//             io.to(roomId).emit(
//                 "user-joined", room.users
//             );
//             console.log("user joined", socket.id, "in room", roomId);
//         })

//         //webRTC singnalling (server sirf relay karata hai)
//         socket.on("offer", ({ roomId, offer }))
//         {
//             //user a ka offer User B ko Bhejo 
//             socket.to(roomId).emit("offer", { offer, from: socket.id });

//         }
//         socket.on("answer", ({ roomId }, answer))
//         {
//             //user b ka answer User A ko Bhejo 
//             socket.to(roomId).emit("answer", { answer, from: socket.id });
//         }

//         socket.on("ice-candidate", ({ roomid, candidate }))
//         {
//             //both user A and B ko ICE candidate  Bhejo 
//             socket.to(roomId).emit("ice-candidate", { canditate, from: socket.id })
//         }

//         // Disconnection 

//         socket.on("disconnect", () => {
//             console.log("User disconnected", socket.id);
//             rooms.forEach((room, roomId) => {
//                 room.users = room.users.filter(id => id !== socket.id);
//                 if (room.users.length === 0) {
//                     rooms.delete(roomId);
//                     console.log("Room deleted", roomId);
//                 }
//                 else {
//                     io.to(roomId).emit("peer-disconnected", socket.id)
//                 }
//             })
//             console.log("disconnected:", socket.id);

//         })
//     })
//     return io;
// }
// // module.exports = initializeSocket;

// export default initializeSocket;

import { Server } from "socket.io";
import { rooms } from "./roommanage.js";

function initializeSocket(server) {
    const io = new Server(server, {
        cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
        console.log("new connection:", socket.id);

        socket.on("create-room", ({ roomId, key }) => {
            rooms.set(roomId, { key, users: [socket.id] });
            socket.join(roomId);
            console.log("Room Created:", roomId);
        });

        socket.on("join-room", ({ roomId, key }) => {
            const room = rooms.get(roomId);
            if (!room) { socket.emit("error", "Room Not found"); return; }
            if (room.key !== key) { socket.emit("error", "Invalid key"); return; }

            room.users.push(socket.id);
            socket.join(roomId);
            io.to(roomId).emit("user-joined", room.users);
            console.log("user joined", socket.id, "in room", roomId);
        });

        // ── NEW: Answerer ready hai — Offerer ko batao ──────
        // User B room page pe load ho gaya aur offer sun sakta hai
        socket.on("answerer-ready", ({ roomId }) => {
            console.log("Answerer ready in room:", roomId);
            socket.to(roomId).emit("answerer-ready"); // User A ko signal
        });

        // ── WebRTC Signaling ─────────────────────────────────
        socket.on("offer", ({ roomId, offer }) => {
            socket.to(roomId).emit("offer", { offer, from: socket.id });
        });

        socket.on("answer", ({ roomId, answer }) => {
            socket.to(roomId).emit("answer", { answer, from: socket.id });
        });

        socket.on("ice-candidate", ({ roomId, candidate }) => {
            socket.to(roomId).emit("ice-candidate", { candidate, from: socket.id });
        });

        // ── Disconnect ────────────────────────────────────────
        socket.on("disconnect", () => {
            rooms.forEach((room, roomId) => {
                room.users = room.users.filter(id => id !== socket.id);
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