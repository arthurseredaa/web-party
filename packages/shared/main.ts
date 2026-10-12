export type Player = {
    id: string;
    name: string;
}

export type RoomState = {
    code: string;
    players: Player[];
}

export type RoomError =
    | 'ROOM_NOT_FOUND'
    | 'ALREADY_IN_ROOM'
    | 'NAME_TAKEN'
    | 'INVALID_NAME'
    | 'ROOM_FULL'
    | 'BAD_REQUEST';

export type RoomAck =
    | {ok: true; room: RoomState}
    | {ok: false; error: RoomError};