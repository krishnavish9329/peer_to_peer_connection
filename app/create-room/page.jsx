'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket/client';

export default function CreateRoomPage() {
    const [key, setKey] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [waiting, setWaiting] = useState(false);
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        localStorage.setItem('role', 'offerer');
        localStorage.setItem('roomKey', key);

        const role = localStorage.getItem('role');
        const roomKey = localStorage.getItem('roomKey');

        console.log("krishna", role, roomKey);

        const socket = getSocket();
        const generatedRoomId = 'room_' + Math.random().toString(36).slice(2, 8);

        socket.emit('create-room', { roomId: generatedRoomId, key });
        setRoomId(generatedRoomId);
        setWaiting(true);

        // Role save karo — room page ko pata chalega ki main offerer hoon
        // const role = localStorage.setItem('role', 'offerer');
        // const roomKey = localStorage.setItem('roomKey', key);
        // console.log(role, roomKey)

        // Jab User B join kare tab redirect karo
        socket.once('user-joined', (users) => {
            if (users.length >= 2) {
                router.push(`/room/${generatedRoomId}`);
            }
        });
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Create Room</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Encryption key (e.g. MySecret@123)"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    required
                    style={{ display: 'block', marginBottom: '0.5rem', padding: '0.4rem' }}
                />
                <button type="submit" disabled={waiting}>Create Room</button>
            </form>

            {roomId && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
                    <p>Room ID: <strong>{roomId}</strong></p>
                    <p>Key: <strong>{key}</strong></p>
                    <p style={{ color: 'orange' }}>⏳ User B ka wait kar rahe hain...</p>
                </div>
            )}
        </div>
    );
}