import crypto from "node:crypto";
import type {Player, RoomAck, RoomState} from "@wp/shared";

// без I та O: на телефоні їх плутають з 1 і 0
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
    | {kind: 'none'}
    | {kind: 'closed'; code: string}
    | {kind: 'left'; room: RoomState};

const randomCode = () => {
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

    constructor(generateCode: () => string = randomCode) {
        this.#generateCode = generateCode;
    }

    createRoom(hostId: string): RoomAck {
        if (this.#codeBySocket.has(hostId)) {
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

    joinRoom(socketId: string, rawCode: string, rawName: string): RoomAck {
        if (this.#codeBySocket.has(socketId)) {
            return {ok: false, error: 'ALREADY_IN_ROOM'};
        }

        const room = this.#rooms.get(rawCode.trim().toUpperCase());
        if (!room) {
            return {ok: false, error: 'ROOM_NOT_FOUND'};
        }

        const name = rawName.trim();
        if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
            return {ok: false, error: 'INVALID_NAME'};
        }

        if (room.players.size >= MAX_PLAYERS) {
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

    removeSocket(socketId: string): RemoveResult {
        const code = this.#codeBySocket.get(socketId);
        const room = code ? this.#rooms.get(code) : undefined;

        this.#codeBySocket.delete(socketId);

        if (!room) {
            return {kind: 'none'};
        }

        if (room.hostId === socketId) {
            for (const playerId of room.players.keys()) {
                this.#codeBySocket.delete(playerId);
            }
            this.#rooms.delete(room.code);

            return {kind: 'closed', code: room.code};
        }

        room.players.delete(socketId);

        return {kind: 'left', room: toState(room)};
    }

    getRoom(code: string): RoomState | undefined {
        const room = this.#rooms.get(code);

        return room ? toState(room) : undefined;
    }
}
