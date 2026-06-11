import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>welcom to peer to peer connection</h1>
      <p>we can share data between two devices, with we can share data into  Computer to mobail also and vice versa</p>
      <Link href="/create-room">Create Room</Link>
      <Link href="/join-room">Join room</Link>
    </div>
  );
}
