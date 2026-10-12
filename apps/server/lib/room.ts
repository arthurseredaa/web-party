import crypto from "node:crypto";

export class RoomRegistry {
    #rooms = new Map<string, string[]>();
    #players = new Map<string, string>();

    createRoom(socketId: string): string | null {
        const code = crypto.randomUUID();

        if (this.#rooms.has(code)) {
            return null;
        }

        this.#rooms.set(code, [socketId]);
        this.#players.set(socketId, code);

        return code
    }

    addUserToRoom(socketId: string, code: string) {
        const room = this.#rooms.get(code);
        const isUserAlreadyInRoom = room?.find((socket) => socket === socketId);

        if (isUserAlreadyInRoom) return;

        if (room) {
            room.push(socketId);
            this.#players.set(socketId, code);
        }
    }
}