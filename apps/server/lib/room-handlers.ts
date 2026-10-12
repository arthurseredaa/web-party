import type {Server, Socket} from "socket.io";
import type {BuzzAck, PlayerBuzzed, RoomAck} from "@wp/shared";
import type {RoomRegistry} from "./room.js";

const isJoinPayload = (value: unknown): value is {code: string; name: string} =>
    typeof value === 'object' && value !== null
    && 'code' in value && typeof value.code === 'string'
    && 'name' in value && typeof value.name === 'string';

const reply = (cb: unknown, ack: RoomAck | BuzzAck) => {
    if (typeof cb === 'function') {
        cb(ack);
    }
}

export const registerRoomHandlers = (io: Server, socket: Socket, roomRegistry: RoomRegistry) => {
    const leaveRoom = () => {
        const result = roomRegistry.removeSocket({socketId: socket.id});

        switch (result.type) {
            case 'closed':
                socket.leave(result.code);
                io.to(result.code).emit('room:closed');
                io.in(result.code).socketsLeave(result.code);
                break;
            case 'left':
                socket.leave(result.room.code);
                io.to(result.room.code).emit('room:state', result.room);
                break;
        }
    }

    socket.on('room:create', (...args: unknown[]) => {
        const result = roomRegistry.createRoom({hostId: socket.id});

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

        const result = roomRegistry.joinRoom({socketId: socket.id, code: payload.code, name: payload.name});

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

    socket.on('player:buzz', (...args: unknown[]) => {
        const cb = args.at(-1);

        // TODO(human)
    })

    socket.on('disconnect', leaveRoom)
}
