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
    privateMessages,
    sendMessage,
    sendPrivateMessage,
  } = useWebSocket(roomId);
  const [text, setText] = useState("");
  const [selectedPeer, setSelectedPeer] = useState("");
  const [privateText, setPrivateText] = useState("")
  return (
    <div>
      <div>
        <h1>Room : {roomId}</h1>
        <h3>Your Peer ID</h3>
        <p>{peerId}</p>
        <hr />
        <h3>Connected Peers</h3>
        {peers.map((peer) => (
          <div key={peer}>{peer}</div>
        ))}
        <hr />

      </div>
      <div style={{ padding: 30 }}>
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
        <select value={selectedPeer} onChange={(e) => setSelectedPeer(e.target.value)}>
          <option value="">Select Peer</option>
          {peers.map(peer => (
            <option key={peer} value={peer}>{peer}</option>
          ))}
        </select>

        <input
          value={privateText}
          onChange={(e) => setPrivateText(e.target.value)}
          placeholder="Message"
        />
        <button onClick={() => {
          sendPrivateMessage(selectedPeer, privateText);
          setText("");
        }}>
          Send Private
        </button>

        <h2>Private Messages</h2>

        {/* {
          privateMessages.map((msg, index) => (
            <div key={index}>
              <strong>{msg.fromPeerId}</strong>

              <p>{msg.message}</p>

              <hr />
            </div>
          ))
        } */}
        {
          privateMessages.map((msg, index) => (
            <div
              key={index}
              style={{
                textAlign: msg.self ? "right" : "left",
              }}
            >
              <b>
                {msg.self ? "You" : msg.fromPeerId}
              </b>

              <p>{msg.message}</p>

              <hr />
            </div>
          ))
        }
      </div>
    </div>
  );
}