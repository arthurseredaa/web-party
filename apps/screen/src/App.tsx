import {useEffect, useState} from "react";
import {io} from "socket.io-client";

const socket = io('http://192.168.0.108:3000');

export const App = () => {
    const [roomCode, setRoomCode] = useState('');

    useEffect(() => {
        socket.on('connect', () => {
            socket.emit('room:create', (code: string) => {
                console.log(code)
                setRoomCode(code);
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