import {useEffect, useState} from "react";
import {QRCodeSVG} from "qrcode.react";
import type {PlayerBuzzed, RoomAck, RoomState} from "@wp/shared";
import {socket} from "./socket";

const BUZZ_HIGHLIGHT_MS = 600;

export const App = () => {
    const [room, setRoom] = useState<RoomState | null>(null);
    const [buzz, setBuzz] = useState<PlayerBuzzed | null>(null);

    useEffect(() => {
        const onConnect = () => {
            socket.emit('room:create', (ack: RoomAck) => {
                if (ack.ok) {
                    setRoom(ack.room);
                }
            })
        }
        const onDisconnect = () => setRoom(null);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('room:state', setRoom);
        socket.on('player:buzzed', setBuzz);

        if (socket.connected) {
            onConnect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('room:state', setRoom);
            socket.off('player:buzzed', setBuzz);
        }
    }, []);

    useEffect(() => {
        if (!buzz) {
            return;
        }

        const timer = setTimeout(() => setBuzz(null), BUZZ_HIGHLIGHT_MS);

        return () => clearTimeout(timer);
    }, [buzz]);

    if (!room) {
        return <p>Підключення до сервера…</p>;
    }

    const joinUrl = `${import.meta.env.VITE_GAMEPAD_URL}/?code=${room.code}`;

    return (
        <main style={{fontFamily: 'system-ui, sans-serif', textAlign: 'center'}}>
            <h1>Код кімнати: {room.code}</h1>
            <QRCodeSVG value={joinUrl} size={240} marginSize={2} />
            <p>{joinUrl}</p>

            <h2>Гравці ({room.players.length})</h2>
            {room.players.length === 0 && <p>Скануй QR-код телефоном, щоб приєднатися</p>}
            <ul style={{listStyle: 'none', padding: 0, fontSize: '1.5rem'}}>
                {room.players.map((player) => (
                    <li
                        key={player.id}
                        style={{
                            padding: '0.25rem',
                            background: player.id === buzz?.playerId ? '#ffd54a' : 'transparent',
                            transition: 'background 150ms',
                        }}
                    >
                        {player.name}
                    </li>
                ))}
            </ul>
        </main>
    )
}
