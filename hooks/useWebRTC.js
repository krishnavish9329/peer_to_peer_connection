"use client";
import { useRef, useCallback } from "react";
import { encryptChunk, decryptChunk } from "@/lib/crypto";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// 64 KB chunks — good balance for encryption overhead + DataChannel throughput
const CHUNK_SIZE = 64 * 1024;

export function useWebRTC({ send, encKey, onP2PChat, onFileProgress, onFileReceive }) {
  const peerConns = useRef({});
  const dataChannels = useRef({});
  // Incoming file state per peer
  const fileBuffers = useRef({});

  // ─── DataChannel setup ────────────────────────────────────────
  const setupDataChannel = useCallback((peerId, channel) => {
    channel.binaryType = "arraybuffer";

    channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        const msg = JSON.parse(event.data);

        if (msg.type === "p2p-chat") {
          onP2PChat?.({ fromPeerId: peerId, message: msg.message, timestamp: msg.timestamp });
          return;
        }

        if (msg.type === "file-meta") {
          fileBuffers.current[peerId] = {
            name: msg.name,
            size: msg.size,
            mimeType: msg.mimeType,
            totalChunks: msg.totalChunks,
            chunks: [],
            receivedChunks: 0,
            receivedBytes: 0,
          };
          onFileProgress?.(peerId, 0, msg.size, msg.name);
          return;
        }

        if (msg.type === "file-chunk-enc") {
          // Encrypted chunk arrived as Base64 string
          const buf = fileBuffers.current[peerId];
          if (!buf) return;

          try {
            const decrypted = decryptChunk(msg.data, encKey);
            buf.chunks.push(decrypted);
            buf.receivedChunks++;
            buf.receivedBytes += decrypted.byteLength;
            onFileProgress?.(peerId, buf.receivedBytes, buf.size, buf.name);
          } catch (err) {
            console.error("[crypto] decrypt failed:", err);
          }
          return;
        }

        if (msg.type === "file-done") {
          const buf = fileBuffers.current[peerId];
          if (!buf) return;
          const blob = new Blob(buf.chunks, { type: buf.mimeType || "application/octet-stream" });
          onFileReceive?.({ fromPeerId: peerId, blob, name: buf.name, size: buf.size });
          delete fileBuffers.current[peerId];
          return;
        }
      }
    };

    channel.onopen = () => console.log(`[DataChannel] open ↔ ${peerId}`);
    channel.onclose = () => console.log(`[DataChannel] closed ↔ ${peerId}`);
    channel.onerror = (e) => console.error(`[DataChannel] error ↔ ${peerId}`, e);

    dataChannels.current[peerId] = channel;
  }, [encKey, onP2PChat, onFileProgress, onFileReceive]);

  // ─── Create RTCPeerConnection ─────────────────────────────────
  const createPeer = useCallback((peerId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        send({ type: "ice-candidate", toPeerId: peerId, payload: candidate });
      }
    };

    pc.ondatachannel = (event) => {
      setupDataChannel(peerId, event.channel);
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC][${peerId.slice(0, 8)}] state: ${pc.connectionState}`);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        closePeer(peerId);
      }
    };

    peerConns.current[peerId] = pc;
    return pc;
  }, [send, setupDataChannel]);

  // ─── Initiate connection (caller side) ───────────────────────
  const initiateOffer = useCallback(async (peerId) => {
    const pc = createPeer(peerId);
    const channel = pc.createDataChannel("main", { ordered: true });
    setupDataChannel(peerId, channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    send({ type: "offer", toPeerId: peerId, payload: offer });
  }, [createPeer, setupDataChannel, send]);

  // ─── Handle incoming offer (callee side) ─────────────────────
  const handleOffer = useCallback(async (fromPeerId, offer) => {
    const pc = createPeer(fromPeerId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    send({ type: "answer", toPeerId: fromPeerId, payload: answer });
  }, [createPeer, send]);

  // ─── Handle incoming answer ───────────────────────────────────
  const handleAnswer = useCallback(async (fromPeerId, answer) => {
    const pc = peerConns.current[fromPeerId];
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  // ─── Handle ICE candidate ─────────────────────────────────────
  const handleIceCandidate = useCallback(async (fromPeerId, candidate) => {
    const pc = peerConns.current[fromPeerId];
    if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);

  // ─── Send P2P chat ────────────────────────────────────────────
  const sendP2PChat = useCallback((peerId, message) => {
    const ch = dataChannels.current[peerId];
    if (ch?.readyState === "open") {
      ch.send(JSON.stringify({ type: "p2p-chat", message, timestamp: Date.now() }));
    }
  }, []);

  // ─── Send encrypted file in chunks ───────────────────────────
  const sendFile = useCallback(async (peerId, file, onProgress) => {
    const ch = dataChannels.current[peerId];
    if (!ch || ch.readyState !== "open") return false;

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Send metadata
    ch.send(JSON.stringify({
      type: "file-meta",
      name: file.name,
      size: file.size,
      mimeType: file.type,
      totalChunks,
    }));

    const buffer = await file.arrayBuffer();
    let offset = 0;
    let chunkIndex = 0;

    while (offset < buffer.byteLength) {
      // Backpressure: wait if channel buffer is too full
      while (ch.bufferedAmount > 4 * 1024 * 1024) {
        await new Promise((r) => setTimeout(r, 50));
      }

      const rawChunk = buffer.slice(offset, offset + CHUNK_SIZE);

      // Encrypt chunk → Base64 string
      const encrypted = encryptChunk(rawChunk, encKey);

      ch.send(JSON.stringify({
        type: "file-chunk-enc",
        index: chunkIndex,
        data: encrypted,
      }));

      offset += CHUNK_SIZE;
      chunkIndex++;
      onProgress?.(offset, buffer.byteLength);

      // Yield to keep UI responsive
      if (chunkIndex % 20 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    ch.send(JSON.stringify({ type: "file-done" }));
    return true;
  }, [encKey]);

  // ─── Close a peer ─────────────────────────────────────────────
  const closePeer = useCallback((peerId) => {
    peerConns.current[peerId]?.close();
    delete peerConns.current[peerId];
    delete dataChannels.current[peerId];
    delete fileBuffers.current[peerId];
  }, []);

  const getChannelState = useCallback((peerId) => {
    return dataChannels.current[peerId]?.readyState ?? "closed";
  }, []);

  return {
    initiateOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    sendP2PChat,
    sendFile,
    closePeer,
    getChannelState,
  };
}
