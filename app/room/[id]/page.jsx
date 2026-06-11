'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getSocket, whenSocketReady } from '@/lib/socket/client';
import {
    createPeerConnection,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    sendFile,
} from '@/lib/webrtc';

const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB+ → direct disk save

function formatSize(bytes) {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
}

export default function RoomPage() {
    const { id: roomId } = useParams();
    const [status, setStatus] = useState('🔌 Connecting...');
    const [connected, setConnected] = useState(false);

    const [sendProgress, setSendProgress] = useState(0);
    const [recvProgress, setRecvProgress] = useState(0);
    const [sending, setSending] = useState(false);
    const [receivedFile, setReceivedFile] = useState(null);
    const [incomingMeta, setIncomingMeta] = useState(null);

    const pcRef = useRef(null);
    const mountedRef = useRef(true);
    const recvStateRef = useRef(null);
    const writeQueueRef = useRef(Promise.resolve());
    const filemetaRef = useRef(null);
    const blobUrlRef = useRef(null);
    const handleIncomingDataRef = useRef(null);

    const setupReceive = useCallback(async (meta) => {
        filemetaRef.current = meta;
        setRecvProgress(0);
        setIncomingMeta({ name: meta.name, size: meta.size });
        setReceivedFile(null);

        if (meta.size >= LARGE_FILE_THRESHOLD && typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({ suggestedName: meta.name });
                const writable = await handle.createWritable();
                recvStateRef.current = { mode: 'stream', writable, received: 0 };
                setStatus(`📥 Badi file aa rahi hai — disk par save hogi: ${meta.name}`);
                return;
            } catch (err) {
                if (err?.name === 'AbortError') {
                    setStatus('❌ Save location cancel — file receive nahi hogi');
                    recvStateRef.current = null;
                    return;
                }
            }
        }

        recvStateRef.current = { mode: 'memory', chunks: [], received: 0 };
        setStatus(`📥 File aa rahi hai: ${meta.name}`);
    }, []);

    const finalizeReceive = useCallback(async () => {
        const state = recvStateRef.current;
        if (!state) return;

        if (state.mode === 'stream' && state.writable) {
            await state.writable.close();
            setReceivedFile({
                name: filemetaRef.current?.name || 'download',
                savedToDisk: true,
            });
            setRecvProgress(100);
            setStatus('✅ File disk par save ho gayi!');
        } else if (state.mode === 'memory') {
            const blob = new Blob(state.chunks, {
                type: filemetaRef.current?.mimeType || 'application/octet-stream',
            });
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;
            setReceivedFile({
                url,
                name: filemetaRef.current?.name || 'download',
                savedToDisk: false,
            });
            setRecvProgress(100);
            setStatus('✅ File receive complete — download karo!');
            state.chunks = [];
        }

        recvStateRef.current = null;
    }, []);

    const handleIncomingData = useCallback((data) => {
        if (typeof data === 'string') {
            const msg = JSON.parse(data);

            if (msg.type === 'file-meta') {
                setupReceive(msg);
                return;
            }

            if (msg.type === 'file-end') {
                writeQueueRef.current = writeQueueRef.current
                    .then(() => finalizeReceive())
                    .catch((err) => console.error('Finalize receive failed:', err));
            }
            return;
        }

        const state = recvStateRef.current;
        if (!state) return;

        writeQueueRef.current = writeQueueRef.current.then(async () => {
            if (state.mode === 'stream' && state.writable) {
                await state.writable.write(new Uint8Array(data));
            } else if (state.mode === 'memory') {
                state.chunks.push(data);
            }

            state.received += data.byteLength;
            if (filemetaRef.current?.size) {
                const pct = Math.round((state.received / filemetaRef.current.size) * 100);
                if (mountedRef.current) {
                    setRecvProgress(Math.min(pct, 99));
                }
            }
        }).catch((err) => console.error('Chunk write failed:', err));
    }, [setupReceive, finalizeReceive]);

    handleIncomingDataRef.current = handleIncomingData;

    useEffect(() => {
        mountedRef.current = true;
        let socket;
        let pc;

        async function init() {
            socket = getSocket();
            await whenSocketReady(socket);

            const role = localStorage.getItem('role');
            const roomKey = localStorage.getItem('roomKey');
            console.log('Role:', role, '| Room:', roomId);

            if (roomKey) {
                socket.emit('rejoin-room', { roomId, key: roomKey });
            }

            pc = createPeerConnection({
                onDataChannelOpen: () => {
                    if (!mountedRef.current) return;
                    setConnected(true);
                    setStatus('✅ P2P Connected! File bhejo ya receive karo.');
                },
                onDataChannelMessage: (data) => {
                    if (!mountedRef.current) return;
                    handleIncomingDataRef.current?.(data);
                },
            });
            pcRef.current = pc;

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit('ice-candidate', { roomId, candidate: e.candidate });
                }
            };

            pc.onconnectionstatechange = () => {
                if (!mountedRef.current) return;
                const state = pc.connectionState;
                console.log('Connection state:', state);
                if (state === 'connecting') {
                    setStatus('🔄 P2P tunnel ban raha hai...');
                } else if (state === 'connected') {
                    setStatus('🔗 Connected, channel open ho raha hai...');
                } else if (['disconnected', 'failed', 'closed'].includes(state)) {
                    setConnected(false);
                    setStatus('❌ Peer disconnected');
                }
            };

            if (role === 'offerer') {
                setStatus('⏳ User B ke ready hone ka wait...');

                socket.once('answerer-ready', async () => {
                    if (!mountedRef.current || !pcRef.current) return;
                    if (pcRef.current.signalingState === 'closed') return;

                    console.log('Answerer ready! Creating offer...');
                    setStatus('📡 Offer bana raha hoon...');

                    const offer = await createOffer(pcRef.current);
                    if (offer) {
                        setStatus('⏳ Answer ka wait...');
                        socket.emit('offer', { roomId, offer });
                    }
                });

                socket.emit('offerer-ready', { roomId });
            } else {
                setStatus('📻 Room mein join ho gaya, offer ka wait...');

                socket.on('offer', async ({ offer }) => {
                    if (!mountedRef.current || !pcRef.current) return;
                    console.log('Offer received!');
                    setStatus('🤝 Offer mila! Answer bana raha hoon...');

                    const answer = await createAnswer(pcRef.current, offer);
                    if (answer) {
                        setStatus('🔗 Answer bheja, connect ho raha hoon...');
                        socket.emit('answer', { roomId, answer });
                    }
                });

                socket.emit('answerer-ready', { roomId });
            }

            socket.on('answer', async ({ answer }) => {
                if (!mountedRef.current || !pcRef.current) return;
                console.log('Answer received!');
                setStatus('🔗 Answer mila, connection finalize ho raha hai...');
                await setRemoteAnswer(pcRef.current, answer);
            });

            socket.on('ice-candidate', async ({ candidate }) => {
                if (pcRef.current) {
                    await addIceCandidate(pcRef.current, candidate);
                }
            });

            socket.on('peer-disconnected', () => {
                if (!mountedRef.current) return;
                setConnected(false);
                setStatus('❌ Peer left the room');
            });
        }

        init();

        return () => {
            mountedRef.current = false;
            if (socket) {
                socket.off('answerer-ready');
                socket.off('offer');
                socket.off('answer');
                socket.off('ice-candidate');
                socket.off('peer-disconnected');
            }
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
        };
    }, [roomId]);

    async function handleFileSend(e) {
        const file = e.target.files?.[0];
        if (!file || !connected) return;

        setSending(true);
        setSendProgress(0);
        setStatus(`📤 Bhej raha hoon: ${file.name} (${formatSize(file.size)})`);

        const ok = await sendFile(file, (sent, total) => {
            setSendProgress(Math.round((sent / total) * 100));
        });

        setSending(false);
        if (ok) {
            setSendProgress(100);
            setStatus('✅ File send ho gayi!');
        } else {
            setStatus('❌ Send fail — connection check karo');
        }
        e.target.value = '';
    }

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '640px' }}>
            <h2>Room: {roomId}</h2>
            <p style={{ color: connected ? 'green' : 'orange', fontSize: '1.1rem' }}>{status}</p>

            {connected && (
                <div>
                    <div style={{
                        border: '1px solid #ccc', borderRadius: '8px',
                        padding: '1.5rem', marginBottom: '1rem',
                    }}>
                        <h3 style={{ marginTop: 0 }}>📤 File Bhejo (A → B ya B → A)</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 0 }}>
                            20-30 GB files chunks mein bheji jati hain — memory safe
                        </p>
                        <input
                            type="file"
                            onChange={handleFileSend}
                            disabled={sending}
                            style={{ display: 'block', marginBottom: '0.8rem' }}
                        />
                        {sending && (
                            <div>
                                <div style={{ background: '#eee', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${sendProgress}%`,
                                        background: '#4caf50',
                                        height: '100%',
                                        transition: 'width 0.2s',
                                    }} />
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#555' }}>{sendProgress}% bheja</p>
                            </div>
                        )}
                        {sendProgress === 100 && !sending && (
                            <p style={{ color: 'green' }}>✅ File send complete!</p>
                        )}
                    </div>

                    {incomingMeta && (
                        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>📥 File Receive</h3>
                            <p style={{ fontSize: '0.9rem' }}>
                                <strong>{incomingMeta.name}</strong> ({formatSize(incomingMeta.size)})
                            </p>
                            {recvProgress < 100 && (
                                <div>
                                    <div style={{ background: '#eee', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${recvProgress}%`,
                                            background: '#2196f3',
                                            height: '100%',
                                            transition: 'width 0.2s',
                                        }} />
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#555' }}>{recvProgress}% mila</p>
                                </div>
                            )}
                            {receivedFile?.savedToDisk && (
                                <p style={{
                                    color: 'green', fontWeight: 'bold', marginTop: '0.8rem',
                                }}>
                                    ✅ File system mein save ho gayi: {receivedFile.name}
                                </p>
                            )}
                            {receivedFile?.url && (
                                <a
                                    href={receivedFile.url}
                                    download={receivedFile.name}
                                    style={{
                                        display: 'inline-block',
                                        marginTop: '0.8rem',
                                        padding: '0.6rem 1.2rem',
                                        background: '#2196f3',
                                        color: '#fff',
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    ⬇️ Download {receivedFile.name}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
