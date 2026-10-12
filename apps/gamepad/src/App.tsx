import {type FormEvent, useEffect, useState} from "react";
import type {BuzzAck, RoomAck, RoomError, RoomState} from "@wp/shared";
import {socket} from "./socket";

const ERROR_MESSAGES: Record<RoomError, string> = {
    ROOM_NOT_FOUND: 'Кімнату з таким кодом не знайдено',
    ALREADY_IN_ROOM: 'Ти вже в кімнаті',
    NAME_TAKEN: 'Це ім\'я вже зайняте',
    INVALID_NAME: 'Ім\'я має бути від 1 до 16 символів',
    ROOM_FULL: 'Кімната заповнена',
    NOT_IN_ROOM: 'Ти не в кімнаті',
    BAD_REQUEST: 'Щось пішло не так, спробуй ще раз',
};

const initialCode = new URLSearchParams(window.location.search).get('code') ?? '';

const fieldStyle = {display: 'block', width: '100%', boxSizing: 'border-box', padding: '0.75rem', fontSize: '1.25rem', marginBottom: '0.75rem'} as const;

export const App = () => {
    const [code, setCode] = useState(initialCode);
    const [name, setName] = useState('');
    const [room, setRoom] = useState<RoomState | null>(null);
    const [message, setMessage] = useState('');
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => {
            setIsConnected(false);
            setRoom(null);
            setMessage('З\'єднання втрачено — зайди в кімнату ще раз');
        }
        const onRoomClosed = () => {
            setRoom(null);
            setMessage('Кімнату закрито');
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('room:state', setRoom);
        socket.on('room:closed', onRoomClosed);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('room:state', setRoom);
            socket.off('room:closed', onRoomClosed);
        }
    }, []);

    const join = (event: FormEvent) => {
        event.preventDefault();
        setMessage('');

        socket.emit('room:join', {code, name}, (ack: RoomAck) => {
            if (ack.ok) {
                setRoom(ack.room);
            } else {
                setMessage(ERROR_MESSAGES[ack.error]);
            }
        })
    }

    const buzz = () => {
        socket.emit('player:buzz', (ack: BuzzAck) => {
            if (!ack.ok) {
                setMessage(ERROR_MESSAGES[ack.error]);
            }
        })
    }

    const me = room?.players.find((player) => player.id === socket.id);

    return (
        <main style={{fontFamily: 'system-ui, sans-serif', maxWidth: '24rem', margin: '0 auto', padding: '1rem'}}>
            {room ? (
                <>
                    <h1>{me?.name}</h1>
                    <p>Кімната {room.code}</p>
                    <button onClick={buzz} style={{...fieldStyle, padding: '3rem 0.75rem', fontSize: '2rem'}}>
                        Тисни!
                    </button>
                </>
            ) : (
                <form onSubmit={join}>
                    <h1>Вхід у кімнату</h1>
                    <input
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        placeholder="Код кімнати"
                        autoCapitalize="characters"
                        autoComplete="off"
                        style={fieldStyle}
                    />
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Твоє ім'я"
                        autoComplete="off"
                        style={fieldStyle}
                    />
                    <button type="submit" disabled={!isConnected} style={fieldStyle}>
                        {isConnected ? 'Увійти' : 'Підключення…'}
                    </button>
                </form>
            )}
            {message && <p role="alert">{message}</p>}
        </main>
    )
}
