import { io } from "socket.io-client";

let socket;

export function getSocket() {
    if (!socket) {
        socket = io(typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000", {
            transports: ['websocket', 'polling'],
            reconnection: true,
        });
    }
    return socket;
}

export function whenSocketReady(sock) {
    return new Promise((resolve) => {
        if (sock.connected) {
            resolve(sock);
            return;
        }
        sock.once('connect', () => resolve(sock));
    });
}

export { socket };
