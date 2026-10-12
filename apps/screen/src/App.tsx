import {useEffect, useState} from "react";
import {io} from "socket.io-client";
import type {RoomAck} from "@wp/shared";

export const App = () => {
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const socket = io(import.meta.env.VITE_SERVER_URL);

        socket.on('connect', () => {
            socket.emit('room:create', (ack: RoomAck) => {
                if (ack.ok) {
                    setRoomCode(ack.room.code);
                    setError('');
                } else {
                    setError(ack.error);
                }
            })
        })

        socket.on('room:closed', () => setRoomCode(''));

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <>
            <h1>Hello, world!</h1>
            <p>{roomCode}</p>
            {error && <p>Error: {error}</p>}
        </>
    )
}
