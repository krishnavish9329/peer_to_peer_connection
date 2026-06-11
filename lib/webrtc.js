// // lib/webrtc.js
// // WebRTC peer connection logic

// let peerConnection = null;
// let dataChannel = null;

// const ICE_SERVERS = {
//     iceServers: [
//         { urls: "stun:stun.l.google.com:19302" },
//         { urls: "stun:stun1.l.google.com:19302" },
//     ]
// };

// /**
//  * Naya PeerConnection banao
//  * onDataChannelOpen  → jab channel ready ho
//  * onDataChannelMsg   → jab koi message/chunk aaye
//  */
// export function createPeerConnection({ onDataChannelOpen, onDataChannelMessage }) {
//     peerConnection = new RTCPeerConnection(ICE_SERVERS);

//     // DataChannel sirf offerer (User A) create karta hai
//     dataChannel = peerConnection.createDataChannel("fileTransfer");
//     dataChannel.binaryType = "arraybuffer";

//     dataChannel.onopen = () => {
//         console.log("DataChannel open!");
//         onDataChannelOpen?.();
//     };
//     dataChannel.onmessage = (e) => onDataChannelMessage?.(e.data);

//     // Answerer ke liye — agar dusri side ne channel open kiya
//     peerConnection.ondatachannel = (e) => {
//         dataChannel = e.channel;
//         dataChannel.binaryType = "arraybuffer";
//         dataChannel.onopen = () => {
//             console.log("DataChannel open (answerer)!");
//             onDataChannelOpen?.();
//         };
//         dataChannel.onmessage = (e2) => onDataChannelMessage?.(e2.data);
//     };

//     return peerConnection;
// }

// /** Offer banao (User A call karta hai) */
// export async function createOffer(pc) {
//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);
//     return offer;
// }

// /** Answer banao (User B call karta hai) */
// export async function createAnswer(pc, offer) {
//     await pc.setRemoteDescription(new RTCSessionDescription(offer));
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);
//     return answer;
// }

// /** User A → answer set karo */
// export async function setRemoteAnswer(pc, answer) {
//     await pc.setRemoteDescription(new RTCSessionDescription(answer));
// }

// /** ICE candidate add karo */
// export async function addIceCandidate(pc, candidate) {
//     if (candidate) {
//         await pc.addIceCandidate(new RTCIceCandidate(candidate));
//     }
// }

// /** DataChannel se data bhejo */
// export function sendData(data) {
//     if (dataChannel && dataChannel.readyState === "open") {
//         dataChannel.send(data);
//     }
// }

// export function getPeerConnection() { return peerConnection; }
// export function getDataChannel() { return dataChannel; }

// lib/webrtc.js

let peerConnection = null;
let dataChannel = null;

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ]
};

export function createPeerConnection({ onDataChannelOpen, onDataChannelMessage }) {
    // Pehle purana close karo agar koi tha
    if (peerConnection && peerConnection.signalingState !== 'closed') {
        peerConnection.close();
    }

    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Offerer DataChannel create karta hai
    dataChannel = peerConnection.createDataChannel("fileTransfer");
    dataChannel.binaryType = "arraybuffer";
    dataChannel.onopen = () => {
        console.log("DataChannel open! (offerer)");
        onDataChannelOpen?.();
    };
    dataChannel.onmessage = (e) => onDataChannelMessage?.(e.data);

    // Answerer ke liye — dusri side ka channel
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

/** Offer banao — state check ke saath */
export async function createOffer(pc) {
    // Agar pc closed/invalid state mein hai toh silently return
    if (!pc || pc.signalingState === 'closed') {
        console.warn('createOffer skipped: pc is closed');
        return null;
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
}

/** Answer banao */
export async function createAnswer(pc, offer) {
    if (!pc || pc.signalingState === 'closed') {
        console.warn('createAnswer skipped: pc is closed');
        return null;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
}

/** Remote answer set karo */
export async function setRemoteAnswer(pc, answer) {
    if (!pc || pc.signalingState === 'closed') return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

/** ICE candidate add karo */
export async function addIceCandidate(pc, candidate) {
    if (!pc || pc.signalingState === 'closed') return;
    if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
}

/** DataChannel se data bhejo */
export function sendData(data) {
    if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(data);
    }
}

export function getPeerConnection() { return peerConnection; }
export function getDataChannel() { return dataChannel; }