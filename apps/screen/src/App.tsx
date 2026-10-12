import {useEffect, useState} from "react";
import {io} from "socket.io-client";
import type {RoomAck} from "@wp/shared";

const socket = io(import.meta.env.VITE_SERVER_URL);

export const App = () => {
    const [roomCode, setRoomCode] = useState('');

    useEffect(() => {
        socket.on('connect', () => {
            socket.emit('room:create', (ack: RoomAck) => {
                if (ack.ok) {
                    setRoomCode(ack.room.code);
                }
            })
        })
    }, [socket]);

    return (
        <>
            <h1>Hello, world!</h1>
            <p>{roomCode}</p>
        </>
    )
}