// import { io } from "socket.io-client";

// export const socket =
//     io("http://localhost:3000");
// lib/socket/client.js
import { io } from "socket.io-client";

let socket;

export function getSocket() {
    if (!socket) {
        socket = io("http://localhost:3000");
    }
    return socket;
}

// Purana direct export bhi rakh sakte ho backward compat ke liye
export { socket };