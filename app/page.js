export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center h-screen ">
            <h1 className="text-2xl font-bold pb-4">Welcome to the Pear to pear </h1>
            <p className="pb-4">We can share data between two devices, with we can share data into  Computer to mobail also and vice versa</p>
            <a href="/join-room" className="bg-blue-500 p-4 rounded-md text-white hover:bg-blue-600 hover:cursor-pointer hover:text-black">Join Room</a>  
        </div>
    );
}   