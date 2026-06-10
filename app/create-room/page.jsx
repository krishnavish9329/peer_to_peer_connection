"use client";

export default function CreateRoom() {

    const createRoom = () => {

        const roomId =
            crypto.randomUUID();

        const key =
            Math.random()
                .toString(36)
                .slice(2);

    };

    return (
        <button>
            Create Room
        </button>
    );
}