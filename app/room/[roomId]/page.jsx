"use client";
import { use } from "react";
import { useState } from "react";
import useWebSocket from "@/hooks/useWebSocket";
export default function Room({ params }) {
  const { roomId } = use(params);
  const {
    peerId,
    peers,
    messages,
    sendMessage,
  } = useWebSocket(roomId);
  const [text, setText] = useState("");
  return (
    <div style={{ padding: 30 }}>
      <h1>Room : {roomId}</h1>
      <h3>Your Peer ID</h3>
      <p>{peerId}</p>
      <hr />
      <h3>Connected Peers</h3>
      {peers.map((peer) => (
        <div key={peer}>{peer}</div>
      ))}
      <hr />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message..."
      />
      <button
        onClick={() => {
          sendMessage(text);
          setText("");
        }}
      >
        Send
      </button>
      <hr />
      <h3>Messages</h3>
      {messages.map((msg, index) => (
        <div key={index}>
          <strong>{msg.fromPeerId}</strong>
          <br />
          {msg.message}
          <hr />
        </div>
      ))}
    </div>
  );
}