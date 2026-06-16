import { io } from "socket.io-client";

let socket;

const ENV = process.env.NODE_ENV;
const API_URL = ENV === "production" ? process.env.NEXT_PUBLIC_LOCAL_API_URL : process.env.NEXT_PUBLIC_PRODUCTION_API_URL;
export function getSocket() {
    console.log(ENV)
    console.log("krishna", API_URL)
    if (!socket) {
        socket = io("https://peer-to-peer-connection.vercel.app", {
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
