'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket/client';

export default function JoinRoomForm() {
    const [roomId, setRoomId] = useState('');
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        const socket = getSocket();
        localStorage.setItem('role', 'answerer');
        localStorage.setItem('roomKey', key);

        const role = localStorage.getItem('role');
        const roomKey = localStorage.getItem('roomKey');

        console.log(role, roomKey);

        // Teri server code expect karti hai: { roomId, key }
        socket.emit('join-room', { roomId, key });

        socket.on('error', (msg) => setError(msg));  // "invalid key" ya "Room Not found"

        socket.on('user-joined', (users) => {
            router.push(`/room/${roomId}`);
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Room ID (User A se lo)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
            />
            <input
                type="text"
                placeholder="Encryption key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
            />
            <button type="submit">Join Room</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}