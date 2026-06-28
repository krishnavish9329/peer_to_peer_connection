"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoom() {
    const [room, setRoom] = useState("");
    const router = useRouter();

    return (
        <div className="flex flex-col item-center justify-center h-screen">
            <div className="flex flex-col item-center justify-center h-screen">
                <h1 className="">Join Room</h1>
                <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Enter Room"
                    className=""
                />
                <button
                    onClick={() => router.push(`/room/${room}`)}
                    className="bg-blue-500 border-2 hover:bg-blue-700 hover:text-black "
                >
                    Join
                </button>
            </div>
        </div>
    );
}
