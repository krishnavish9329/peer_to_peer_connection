"use client";

import { useEffect, useRef, useState } from "react";

const SOCKET_URL = "wss://websocket-node-wnir.onrender.com";

export default function useWebSocket(roomId) {
  const socket = useRef(null);

  const [peerId, setPeerId] = useState("");
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(SOCKET_URL);

    socket.current = ws;

    ws.onopen = () => {
      console.log("Connected");

      ws.send(
        JSON.stringify({
          type: "join-room",
          roomId,
        })
      );
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      console.log("Received:", msg);

      switch (msg.type) {
        case "room-joined":
          setPeerId(msg.peerId);
          setPeers(msg.peers);
          break;

        case "peer-joined":
          setPeers((prev) => [...prev, msg.peerId]);
          break;

        case "peer-left":
          setPeers((prev) =>
            prev.filter((id) => id !== msg.peerId)
          );
          break;

        case "broadcast-chat":
          setMessages((prev) => [...prev, msg]);
          break;

        case "private-message":
          setPrivateMessages(prev => [...prev, msg]);
          break;

        default:
          console.log(msg);
      }
    };

    ws.onclose = () => {
      console.log("Socket Closed");
    };

    return () => ws.close();
  }, [roomId]);

  // Send chat message
  const sendMessage = (message) => {
    if (!socket.current) return;

    socket.current.send(
      JSON.stringify({
        type: "broadcast-chat",
        message,
      })
    );

    // Show your own message immediately
    setMessages((prev) => [
      ...prev,
      {
        fromPeerId: peerId,
        message,
      },
    ]);
  };
  const sendPrivateMessage = (toPeerId, message) => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.current.send(
      JSON.stringify({
        type: "private-message",
        toPeerId: toPeerId,
        message: message,
      }),
      // Add sender's own message locally
      setPrivateMessages((prev) => [
        ...prev,
        {
          type: "private-message",
          fromPeerId: peerId,
          toPeerId,
          message,
          timestamp: Date.now(),
          self: true,
        },
      ])
    );
  console.log("send message to ", toPeerId, "the Message is ", message)
};

return {
  peerId,
  peers,
  messages,
  privateMessages,
  sendMessage,
  sendPrivateMessage,
};
}