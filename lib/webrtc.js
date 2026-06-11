let peerConnection = null;
let dataChannel = null;
const pendingIceCandidates = [];

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ]
};

export function createPeerConnection({ onDataChannelOpen, onDataChannelMessage }) {
    if (peerConnection && peerConnection.signalingState !== 'closed') {
        peerConnection.close();
    }
    pendingIceCandidates.length = 0;

    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    dataChannel = peerConnection.createDataChannel("fileTransfer", {
        ordered: true,
    });
    dataChannel.binaryType = "arraybuffer";
    dataChannel.onopen = () => {
        console.log("DataChannel open! (offerer)");
        onDataChannelOpen?.();
    };
    dataChannel.onmessage = (e) => onDataChannelMessage?.(e.data);

    peerConnection.ondatachannel = (e) => {
        dataChannel = e.channel;
        dataChannel.binaryType = "arraybuffer";
        dataChannel.onopen = () => {
            console.log("DataChannel open! (answerer)");
            onDataChannelOpen?.();
        };
        dataChannel.onmessage = (e2) => onDataChannelMessage?.(e2.data);
    };

    return peerConnection;
}

async function flushPendingIceCandidates(pc) {
    if (!pc?.remoteDescription) return;
    while (pendingIceCandidates.length > 0) {
        const candidate = pendingIceCandidates.shift();
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.warn("ICE candidate add failed:", err);
        }
    }
}

export async function createOffer(pc) {
    if (!pc || pc.signalingState === 'closed') {
        console.warn('createOffer skipped: pc is closed');
        return null;
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
}

export async function createAnswer(pc, offer) {
    if (!pc || pc.signalingState === 'closed') {
        console.warn('createAnswer skipped: pc is closed');
        return null;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushPendingIceCandidates(pc);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
}

export async function setRemoteAnswer(pc, answer) {
    if (!pc || pc.signalingState === 'closed') return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    await flushPendingIceCandidates(pc);
}

export async function addIceCandidate(pc, candidate) {
    if (!pc || pc.signalingState === 'closed' || !candidate) return;
    if (!pc.remoteDescription) {
        pendingIceCandidates.push(candidate);
        return;
    }
    try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
        console.warn("ICE candidate add failed:", err);
    }
}

export function sendData(data) {
    if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(data);
    }
}

// 256KB chunks — 20-30GB files ke liye efficient aur memory-safe
const CHUNK_SIZE = 256 * 1024;
const MAX_BUFFERED = 8 * 1024 * 1024;

function waitForBufferLow(channel) {
    return new Promise((resolve) => {
        if (channel.bufferedAmount <= MAX_BUFFERED / 2) {
            resolve();
            return;
        }
        const onLow = () => {
            channel.removeEventListener('bufferedamountlow', onLow);
            resolve();
        };
        channel.bufferedAmountLowThreshold = MAX_BUFFERED / 4;
        channel.addEventListener('bufferedamountlow', onLow);
    });
}

/**
 * File bhejo chunks mein (20-30GB tak support)
 * @param {File} file
 * @param {(sent: number, total: number) => void} onProgress
 */
export async function sendFile(file, onProgress) {
    if (!dataChannel || dataChannel.readyState !== 'open') {
        console.error('DataChannel open nahi hai');
        return false;
    }

    const totalSize = file.size;
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

    dataChannel.send(JSON.stringify({
        type: 'file-meta',
        name: file.name,
        size: totalSize,
        totalChunks,
        mimeType: file.type || 'application/octet-stream',
    }));

    let offset = 0;
    while (offset < totalSize) {
        await waitForBufferLow(dataChannel);

        const buffer = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
        dataChannel.send(buffer);
        offset += buffer.byteLength;
        onProgress?.(Math.min(offset, totalSize), totalSize);
    }

    dataChannel.send(JSON.stringify({ type: 'file-end' }));
    return true;
}

export function getPeerConnection() { return peerConnection; }
export function getDataChannel() { return dataChannel; }
