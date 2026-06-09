"use client"
import React, {useState} from "react"
const PeerToPeer = () => {
    const [roomId ,setRoomId] = useState(null)
    const [sKey,setSKey]=useState("")
    const handleSubmit =(e)=>{
        e.preventDefault()
        console.log(roomId , "roomId" ,sKey , "sKey")
    }

    return (
        <div> 
            <h1>Enter the room</h1>
            <p>Enter the room to start the peer to peer connection</p>
            <div>
            <input 
            type="number" 
            name="" 
            id=""
            onClick={(e)=>{setRoomId(e.target.value)}}
            placeholder="Enter the room ID "
             />
             <input 
            type="text" 
            name="" 
            id=""
            onClick={(e)=>{setSKey(e.target.value)}}
            placeholder="Enter the sKey "
             />
            <button onClick={handleSubmit}>Submit</button>
            </div>

            
        </div>
    )
}
export default PeerToPeer;
