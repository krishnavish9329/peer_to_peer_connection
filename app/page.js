// // import Link from "next/link";

// // export default function Home() {
// //   return (
// //     <div>
// //       <h1>welcom to peer to peer connection</h1>
// //       <p>we can share data between two devices, with we can share data into  Computer to mobail also and vice versa</p>
// //       <Link href="/create-room">Create Room</Link>
// //       <br />
// //       <br />
// //       <Link href="/join-room">Join room</Link>
// //     </div>
// //   );
// // }

// import Link from "next/link";

// export default function Home() {
//   return (
//     <main className="home-root">
//       <div className="hero">
//         <div className="logo-mark">⇄</div>
//         <h1 className="hero-title">P2P<span className="accent">Share</span></h1>
//         <p className="hero-sub">
//           Direct peer-to-peer file transfer &amp; chat.<br />
//           Files are AES-encrypted end-to-end — only you and your peer hold the key.
//         </p>

//         <div className="action-row">
//           <Link href="/create-room" className="btn btn-primary">
//             <span className="btn-icon">＋</span>
//             Create Room
//           </Link>
//           <Link href="/join-room" className="btn btn-ghost">
//             <span className="btn-icon">→</span>
//             Join Room
//           </Link>
//         </div>

//         <ul className="feature-list">
//           <li>
//             <span className="feat-icon">🔒</span>
//             <div>
//               <strong>End-to-end encrypted</strong>
//               <p>Every chunk is AES-encrypted with your passphrase before it leaves your device.</p>
//             </div>
//           </li>
//           <li>
//             <span className="feat-icon">⚡</span>
//             <div>
//               <strong>Large file support</strong>
//               <p>Transfer files up to 60–70 GB via chunked streaming — no server storage.</p>
//             </div>
//           </li>
//           <li>
//             <span className="feat-icon">💬</span>
//             <div>
//               <strong>Real-time P2P chat</strong>
//               <p>Encrypted messages over the same WebRTC data channel.</p>
//             </div>
//           </li>
//         </ul>
//       </div>

//       <style>{`
//         .home-root {
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: #0a0a0f;
//           padding: 2rem;
//           font-family: 'Inter', system-ui, sans-serif;
//         }
//         .hero {
//           text-align: center;
//           max-width: 520px;
//           width: 100%;
//         }
//         .logo-mark {
//           font-size: 3rem;
//           color: #6c63ff;
//           margin-bottom: 0.5rem;
//           line-height: 1;
//         }
//         .hero-title {
//           font-size: clamp(2.6rem, 8vw, 4rem);
//           font-weight: 800;
//           color: #f0eeff;
//           margin: 0 0 1rem;
//           letter-spacing: -0.03em;
//         }
//         .accent { color: #6c63ff; }
//         .hero-sub {
//           color: #9991cc;
//           font-size: 1rem;
//           line-height: 1.7;
//           margin-bottom: 2.5rem;
//         }
//         .action-row {
//           display: flex;
//           gap: 1rem;
//           justify-content: center;
//           flex-wrap: wrap;
//           margin-bottom: 3rem;
//         }
//         .btn {
//           display: inline-flex;
//           align-items: center;
//           gap: 0.5rem;
//           padding: 0.75rem 1.75rem;
//           border-radius: 10px;
//           font-size: 1rem;
//           font-weight: 600;
//           text-decoration: none;
//           transition: transform 0.15s, box-shadow 0.15s;
//           cursor: pointer;
//         }
//         .btn:hover { transform: translateY(-2px); }
//         .btn-primary {
//           background: #6c63ff;
//           color: #fff;
//           box-shadow: 0 4px 20px rgba(108, 99, 255, 0.4);
//         }
//         .btn-primary:hover { box-shadow: 0 6px 28px rgba(108, 99, 255, 0.55); }
//         .btn-ghost {
//           background: transparent;
//           color: #c0b8ff;
//           border: 1.5px solid #3a3560;
//         }
//         .btn-ghost:hover { border-color: #6c63ff; color: #fff; }
//         .btn-icon { font-size: 1.1rem; }
//         .feature-list {
//           list-style: none;
//           padding: 0;
//           margin: 0;
//           display: flex;
//           flex-direction: column;
//           gap: 1rem;
//           text-align: left;
//         }
//         .feature-list li {
//           display: flex;
//           gap: 1rem;
//           background: #12111e;
//           border: 1px solid #22203a;
//           border-radius: 12px;
//           padding: 1rem 1.2rem;
//           align-items: flex-start;
//         }
//         .feat-icon { font-size: 1.4rem; flex-shrink: 0; margin-top: 2px; }
//         .feature-list strong { color: #e8e4ff; font-size: 0.95rem; display: block; margin-bottom: 0.2rem; }
//         .feature-list p { margin: 0; color: #6e6a99; font-size: 0.85rem; line-height: 1.5; }
//       `}</style>
//     </main>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {

    const [room, setRoom] = useState("");

    const router = useRouter();

    return (

        <div>

            <h1>Join Room</h1>

            <input

                value={room}

                onChange={(e) => setRoom(e.target.value)}

                placeholder="Enter Room"

            />

            <button

                onClick={() => router.push(`/room/${room}`)}

            >

                Join

            </button>

        </div>

    );

}