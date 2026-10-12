import crypto from "node:crypto";
import type {Player, RoomAck, RoomState} from "@wp/shared";

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 4;
const MAX_PLAYERS = 8;
const MAX_NAME_LENGTH = 16;

type Room = {
    code: string;
    hostId: string;
    players: Map<string, Player>;
}

export type RemoveResult =
    | {type: 'none'}
    | {type: 'closed'; code: string}
    | {type: 'left'; room: RoomState};

const generateRandomCode = () => {
    let code = '';

    for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    }

    return code;
}

const toState = (room: Room): RoomState => ({
    code: room.code,
    players: [...room.players.values()],
})

export class RoomRegistry {
    #rooms = new Map<string, Room>();
    #codeBySocket = new Map<string, string>();
    #generateCode: () => string;

    constructor(generateCode: () => string = generateRandomCode) {
        this.#generateCode = generateCode;
    }

    createRoom({hostId}: {hostId: string}): RoomAck {
        const isAlreadyInRoom = this.#codeBySocket.has(hostId);
        if (isAlreadyInRoom) {
            return {ok: false, error: 'ALREADY_IN_ROOM'};
        }

        let code = this.#generateCode();
        while (this.#rooms.has(code)) {
            code = this.#generateCode();
        }

        const room: Room = {code, hostId, players: new Map()};

        this.#rooms.set(code, room);
        this.#codeBySocket.set(hostId, code);

        return {ok: true, room: toState(room)};
    }

    joinRoom({socketId, code: rawCode, name: rawName}: {socketId: string; code: string; name: string}): RoomAck {
        const isAlreadyInRoom = this.#codeBySocket.has(socketId);
        if (isAlreadyInRoom) {
            return {ok: false, error: 'ALREADY_IN_ROOM'};
        }

        const room = this.#rooms.get(rawCode.trim().toUpperCase());
        if (!room) {
            return {ok: false, error: 'ROOM_NOT_FOUND'};
        }

        const name = rawName.trim();
        const isNameInvalid = name.length === 0 || name.length > MAX_NAME_LENGTH;
        if (isNameInvalid) {
            return {ok: false, error: 'INVALID_NAME'};
        }

        const isRoomFull = room.players.size >= MAX_PLAYERS;
        if (isRoomFull) {
            return {ok: false, error: 'ROOM_FULL'};
        }

        const isNameTaken = [...room.players.values()]
            .some((player) => player.name.toLowerCase() === name.toLowerCase());
        if (isNameTaken) {
            return {ok: false, error: 'NAME_TAKEN'};
        }

        room.players.set(socketId, {id: socketId, name});
        this.#codeBySocket.set(socketId, room.code);

        return {ok: true, room: toState(room)};
    }

    removeSocket({socketId}: {socketId: string}): RemoveResult {
        const code = this.#codeBySocket.get(socketId);
        const room = code ? this.#rooms.get(code) : undefined;

        this.#codeBySocket.delete(socketId);

        if (!room) {
            return {type: 'none'};
        }

        const isHost = room.hostId === socketId;
        if (isHost) {
            for (const playerId of room.players.keys()) {
                this.#codeBySocket.delete(playerId);
            }
            this.#rooms.delete(room.code);

            return {type: 'closed', code: room.code};
        }

        room.players.delete(socketId);

        return {type: 'left', room: toState(room)};
    }

    getRoom(code: string): RoomState | undefined {
        const room = this.#rooms.get(code);

        return room ? toState(room) : undefined;
    }

    findPlayerRoomCode({socketId}: {socketId: string}): string | undefined {
        const code = this.#codeBySocket.get(socketId);
        const room = code ? this.#rooms.get(code) : undefined;

        return room?.players.has(socketId) ? room.code : undefined;
    }
}
