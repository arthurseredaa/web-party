import express from 'express';
import {helloWorld, type RoomAck} from "@wp/shared";
import {createServer} from "node:http";
import {Server} from "socket.io";
import {RoomRegistry} from "./lib/room.js";

const app = express()
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173']
    }
});

const roomRegistry = new RoomRegistry()

const isJoinPayload = (value: unknown): value is {code: string; name: string} =>
    typeof value === 'object' && value !== null
    && 'code' in value && typeof value.code === 'string'
    && 'name' in value && typeof value.name === 'string';

const reply = (cb: unknown, ack: RoomAck | {ok: true}) => {
    if (typeof cb === 'function') {
        cb(ack);
    }
}

io.on('connection', (socket) => {
    console.log(socket.id);

    const leaveRoom = () => {
        const result = roomRegistry.removeSocket(socket.id);

        if (result.kind === 'closed') {
            socket.leave(result.code);
            io.to(result.code).emit('room:closed');
            io.in(result.code).socketsLeave(result.code);
        }

        if (result.kind === 'left') {
            socket.leave(result.room.code);
            io.to(result.room.code).emit('room:state', result.room);
        }
    }

    socket.on('room:create', (...args: unknown[]) => {
        const result = roomRegistry.createRoom(socket.id);

        if (result.ok) {
            socket.join(result.room.code);
        }

        reply(args.at(-1), result);
    })

    socket.on('room:join', (...args: unknown[]) => {
        const payload = args[0];
        const cb = args.at(-1);

        if (!isJoinPayload(payload)) {
            reply(cb, {ok: false, error: 'BAD_REQUEST'});
            return;
        }

        const result = roomRegistry.joinRoom(socket.id, payload.code, payload.name);

        if (result.ok) {
            socket.join(result.room.code);
            io.to(result.room.code).emit('room:state', result.room);
        }

        reply(cb, result);
    })

    socket.on('room:leave', (...args: unknown[]) => {
        leaveRoom();
        reply(args.at(-1), {ok: true});
    })

    socket.on('disconnect', leaveRoom)
})

server.listen(3000, () => {
    console.log('Server started on port 3000');
    helloWorld();
})