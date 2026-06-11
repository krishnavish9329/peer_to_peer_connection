// // // const page = () => {
// // //     return (
// // //         <div>
// // //             <h1>Room</h1>
// // //         </div>
// // //     );
// // // };

// // // export default page;
// // 'use client';
// // import { useEffect, useRef, useState } from 'react';
// // import { useParams } from 'next/navigation';
// // import { getSocket } from '@/lib/socket/client';
// // import {
// //     createPeerConnection,
// //     createOffer,
// //     createAnswer,
// //     setRemoteAnswer,
// //     addIceCandidate,
// //     sendData,
// //     getPeerConnection,
// // } from '@/lib/webrtc';

// // export default function RoomPage() {
// //     const { id: roomId } = useParams();
// //     const [status, setStatus] = useState('Waiting for peer...');
// //     const [connected, setConnected] = useState(false);
// //     const [messages, setMessages] = useState([]);  // test ke liye
// //     const [input, setInput] = useState('');
// //     const isOfferer = useRef(false);  // User A = true, User B = false

// //     useEffect(() => {
// //         const socket = getSocket();

// //         // ── WebRTC Setup ────────────────────────────────────────
// //         const pc = createPeerConnection({
// //             onDataChannelOpen: () => {
// //                 setConnected(true);
// //                 setStatus('✅ Connected! P2P ready.');
// //             },
// //             onDataChannelMessage: (data) => {
// //                 // Text ya file chunk yahan aayega
// //                 if (typeof data === 'string') {
// //                     setMessages(prev => [...prev, `Peer: ${data}`]);
// //                 }
// //             }
// //         });

// //         // ICE candidates gather hone pe server ko bhejo
// //         pc.onicecandidate = (e) => {
// //             if (e.candidate) {
// //                 socket.emit('ice-candidate', { roomId, candidate: e.candidate });
// //             }
// //         };

// //         pc.onconnectionstatechange = () => {
// //             console.log('Connection state:', pc.connectionState);
// //             if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
// //                 setConnected(false);
// //                 setStatus('❌ Peer disconnected');
// //             }
// //         };

// //         // ── Socket Events ───────────────────────────────────────

// //         // Jab dono users room mein aa jayen
// //         socket.on('user-joined', async (users) => {
// //             console.log('Users in room:', users);

// //             // Pehla user (User A) = offerer
// //             if (users.length === 2 && users[0] === socket.id) {
// //                 isOfferer.current = true;
// //                 setStatus('Peer joined! Creating offer...');

// //                 const offer = await createOffer(pc);
// //                 socket.emit('offer', { roomId, offer });
// //             }
// //         });

// //         // User B ko offer mila → answer bhejo
// //         socket.on('offer', async ({ offer }) => {
// //             setStatus('Offer mila! Connecting...');
// //             const answer = await createAnswer(pc, offer);
// //             socket.emit('answer', { roomId, answer });
// //         });

// //         // User A ko answer mila
// //         socket.on('answer', async ({ answer }) => {
// //             await setRemoteAnswer(pc, answer);
// //         });

// //         // ICE candidates exchange
// //         socket.on('ice-candidate', async ({ candidate }) => {
// //             await addIceCandidate(pc, candidate);
// //         });

// //         // Peer disconnect
// //         socket.on('peer-disconnected', () => {
// //             setConnected(false);
// //             setStatus('❌ Peer left the room');
// //         });

// //         return () => {
// //             socket.off('user-joined');
// //             socket.off('offer');
// //             socket.off('answer');
// //             socket.off('ice-candidate');
// //             socket.off('peer-disconnected');
// //             pc.close();
// //         };
// //     }, [roomId]);

// //     const sendMessage = () => {
// //         if (!input.trim()) return;
// //         sendData(input);
// //         setMessages(prev => [...prev, `Me: ${input}`]);
// //         setInput('');
// //     };

// //     return (
// //         <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
// //             <h2>Room: {roomId}</h2>
// //             <p style={{ color: connected ? 'green' : 'orange' }}>{status}</p>

// //             {/* Test: simple text send */}
// //             {connected && (
// //                 <div style={{ marginTop: '1rem' }}>
// //                     <h3>Test Chat (P2P)</h3>
// //                     <div style={{
// //                         border: '1px solid #ccc', padding: '1rem',
// //                         height: '200px', overflowY: 'auto', marginBottom: '0.5rem'
// //                     }}>
// //                         {messages.map((m, i) => <div key={i}>{m}</div>)}
// //                     </div>
// //                     <input
// //                         value={input}
// //                         onChange={e => setInput(e.target.value)}
// //                         placeholder="Type a message..."
// //                         style={{ marginRight: '0.5rem', padding: '0.4rem' }}
// //                         onKeyDown={e => e.key === 'Enter' && sendMessage()}
// //                     />
// //                     <button onClick={sendMessage}>Send</button>
// //                 </div>
// //             )}

// //             {/* TODO: File upload component yahan aayega */}
// //         </div>
// //     );
// // }

// 'use client';
// import { useEffect, useRef, useState } from 'react';
// import { useParams } from 'next/navigation';
// import { getSocket } from '@/lib/socket/client';
// import {
//     createPeerConnection,
//     createOffer,
//     createAnswer,
//     setRemoteAnswer,
//     addIceCandidate,
//     sendData,
// } from '@/lib/webrtc';

// export default function RoomPage() {
//     const { id: roomId } = useParams();
//     const [status, setStatus] = useState('🔌 Connecting...');
//     const [connected, setConnected] = useState(false);
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState('');
//     const pcRef = useRef(null);

//     useEffect(() => {
//         const socket = getSocket();

//         // localStorage se role lo — create-room ne 'offerer' save kiya, join-room ne 'answerer'
//         const role = localStorage.getItem('role'); // 'offerer' | 'answerer'
//         console.log('My role:', role, '| Room:', roomId);

//         // ── WebRTC Setup ─────────────────────────────────────
//         const pc = createPeerConnection({
//             onDataChannelOpen: () => {
//                 setConnected(true);
//                 setStatus('✅ P2P Connected!');
//             },
//             onDataChannelMessage: (data) => {
//                 if (typeof data === 'string') {
//                     setMessages(prev => [...prev, `Peer: ${data}`]);
//                 }
//             }
//         });
//         pcRef.current = pc;

//         // ICE candidates → server ko bhejo
//         pc.onicecandidate = (e) => {
//             if (e.candidate) {
//                 socket.emit('ice-candidate', { roomId, candidate: e.candidate });
//             }
//         };

//         pc.onconnectionstatechange = () => {
//             if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
//                 setConnected(false);
//                 setStatus('❌ Peer disconnected');
//             }
//         };

//         // ── Signaling Events ──────────────────────────────────

//         // User B: offer aaya → answer bhejo
//         socket.on('offer', async ({ offer }) => {
//             console.log('Offer received');
//             setStatus('🤝 Offer mila, connecting...');
//             const answer = await createAnswer(pc, offer);
//             socket.emit('answer', { roomId, answer });
//         });

//         // User A: answer aaya
//         socket.on('answer', async ({ answer }) => {
//             console.log('Answer received');
//             await setRemoteAnswer(pc, answer);
//         });

//         // Dono: ICE candidates
//         socket.on('ice-candidate', async ({ candidate }) => {
//             await addIceCandidate(pc, candidate);
//         });

//         // Peer left
//         socket.on('peer-disconnected', () => {
//             setConnected(false);
//             setStatus('❌ Peer left the room');
//         });

//         // ── Role based action ─────────────────────────────────
//         // Offerer (User A) hain → turant offer banao
//         // Answerer (User B) hain → offer ka wait karo (socket.on('offer') handle karega)
//         if (role === 'offerer') {
//             setStatus('📡 Offer bhej raha hoon...');
//             // Thoda wait karo taaki User B ka socket bhi ready ho jaye
//             setTimeout(async () => {
//                 const offer = await createOffer(pc);
//                 socket.emit('offer', { roomId, offer });
//             }, 500);
//         } else {
//             setStatus('⏳ Offer ka intezaar...');
//         }

//         // ── Cleanup ───────────────────────────────────────────
//         return () => {
//             socket.off('offer');
//             socket.off('answer');
//             socket.off('ice-candidate');
//             socket.off('peer-disconnected');
//             pc.close();
//             localStorage.removeItem('role');
//         };
//     }, [roomId]);

//     const sendMessage = () => {
//         if (!input.trim()) return;
//         sendData(input);
//         setMessages(prev => [...prev, `Me: ${input}`]);
//         setInput('');
//     };

//     return (
//         <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
//             <h2>Room: {roomId}</h2>
//             <p style={{ color: connected ? 'green' : 'orange', fontSize: '1.1rem' }}>
//                 {status}
//             </p>

//             {connected && (
//                 <div style={{ marginTop: '1.5rem' }}>
//                     <h3>P2P Test Chat</h3>
//                     <div style={{
//                         border: '1px solid #ccc',
//                         borderRadius: '6px',
//                         padding: '1rem',
//                         height: '200px',
//                         overflowY: 'auto',
//                         marginBottom: '0.5rem',
//                         background: '#fafafa'
//                     }}>
//                         {messages.length === 0
//                             ? <span style={{ color: '#999' }}>Messages yahan dikhenge...</span>
//                             : messages.map((m, i) => <div key={i}>{m}</div>)
//                         }
//                     </div>
//                     <input
//                         value={input}
//                         onChange={e => setInput(e.target.value)}
//                         placeholder="Type a message..."
//                         style={{ padding: '0.4rem', marginRight: '0.5rem', width: '250px' }}
//                         onKeyDown={e => e.key === 'Enter' && sendMessage()}
//                     />
//                     <button onClick={sendMessage}>Send</button>
//                 </div>
//             )}

//             {/* File transfer component baad mein yahan aayega */}
//         </div>
//     );
// }


//2-------------------------------------------------------------------------------------------------------
'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSocket } from '@/lib/socket/client';
import {
    createPeerConnection,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    sendData,
} from '@/lib/webrtc';

export default function RoomPage() {
    const { id: roomId } = useParams();
    const [status, setStatus] = useState('🔌 Connecting...');
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const pcRef = useRef(null);
    const mountedRef = useRef(true);
    const role = localStorage.getItem('role')

    const receivedChunksRef = useRef([]);
    const fileNameRef = useRef('');
    const [downloadFile, setDownloadFile] = useState(null);

    useEffect(() => {
        mountedRef.current = true;
        const socket = getSocket();
        //role = localStorage.getItem('role'); // 'offerer' | 'answerer'
        console.log('Role:', role, '| Room:', roomId);

        // console.log(
        //     'Saved Role:',
        //     localStorage.getItem('role')
        // );
        // ── PeerConnection ──────────────────────────────────
        const pc = createPeerConnection({
            onDataChannelOpen: () => {
                if (!mountedRef.current) return;
                setConnected(true);
                setStatus('✅ P2P Connected!');
            },
            onDataChannelMessage: (data) => {
                if (!mountedRef.current) return;
                if (typeof data === 'string') {
                    setMessages(prev => [...prev, `Peer: ${data}`]);
                }
            }
        });
        pcRef.current = pc;

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit('ice-candidate', { roomId, candidate: e.candidate });
            }
        };

        pc.onconnectionstatechange = () => {
            if (!mountedRef.current) return;
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                setConnected(false);
                setStatus('❌ Peer disconnected');
            }
        };

        // ── Socket Listeners ─────────────────────────────────

        console.log("role", role)

        if (role === 'offerer') {
            // User A: User B ke ready signal ka wait karo, TAB offer bhejo
            console.log("")
            setStatus('⏳ User B ke ready hone ka wait...');

            socket.once('answerer-ready', async () => {
                if (!mountedRef.current) return;
                if (!pcRef.current || pcRef.current.signalingState === 'closed') return;

                console.log('Answerer ready! Creating offer...');
                setStatus('📡 Offer bana raha hoon...');

                const offer = await createOffer(pcRef.current);
                if (offer) socket.emit('offer', { roomId, offer });
            });

        } else {
            // User B: pehle listener set karo, PHIR server ko ready signal bhejo
            setStatus('📻 Offer sun raha hoon...');

            socket.on('offer', async ({ offer }) => {
                if (!mountedRef.current) return;
                console.log('Offer received!');
                setStatus('🤝 Offer mila, answer bana raha hoon...');

                const answer = await createAnswer(pc, offer);
                if (answer) socket.emit('answer', { roomId, answer });
            });

            // Listener ready hai — ab User A ko batao
            socket.emit('answerer-ready', { roomId });
            console.log('Sent answerer-ready');
        }

        // Dono ke liye common listeners
        socket.on('answer', async ({ answer }) => {
            if (!mountedRef.current) return;
            console.log('Answer received!');
            await setRemoteAnswer(pc, answer);
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            await addIceCandidate(pc, candidate);
        });

        socket.on('peer-disconnected', () => {
            if (!mountedRef.current) return;
            setConnected(false);
            setStatus('❌ Peer left the room');
        });

        // ── Cleanup ───────────────────────────────────────────
        return () => {
            mountedRef.current = false;
            socket.off('answerer-ready');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            socket.off('peer-disconnected');

            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            localStorage.removeItem('role');
        };
    }, [roomId]);

    const sendFile = async (file) => {
        // chunk sending logic
    }

    const sendMessage = () => {
        if (!input.trim()) return;
        sendData(input);
        setMessages(prev => [...prev, `Me: ${input}`]);
        setInput('');
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h2>Room: {roomId}</h2>
            <p style={{ color: connected ? 'green' : 'orange', fontSize: '1.1rem' }}>{status}</p>

            {connected && (
                <div style={{ marginTop: '1.5rem' }}>
                    <h3>🎉 P2P Test Chat</h3>
                    <div style={{
                        border: '1px solid #ccc', borderRadius: '6px',
                        padding: '1rem', height: '200px', overflowY: 'auto',
                        marginBottom: '0.5rem', background: '#fafafa'
                    }}>
                        {messages.length === 0
                            ? <span style={{ color: '#999' }}>Messages yahan dikhenge...</span>
                            : messages.map((m, i) => <div key={i}>{m}</div>)
                        }
                    </div>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type a message..."
                        style={{ padding: '0.4rem', marginRight: '0.5rem', width: '250px' }}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <input
                        type="file"
                        onChange={(e) => sendFile(e.target.files[0])}
                    />
                    <button onClick={sendMessage}>Send</button>
                    <a href={downloadFile.url} download={downloadFile.name}>
                        <button>Download File</button>
                    </a>
                </div>
            )}
        </div>
    );
}