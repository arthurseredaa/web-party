import {useEffect, useState} from "react";
import {io} from "socket.io-client";
import type {RoomAck} from "@wp/shared";

const socket = io('http://192.168.0.108:3000');

export const App = () => {
    const [roomCode, setRoomCode] = useState('');

    useEffect(() => {
        socket.on('connect', () => {
            socket.emit('room:create', (ack: RoomAck) => {
                console.log(ack)
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