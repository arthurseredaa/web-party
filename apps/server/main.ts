import express from 'express';
import {createServer} from "node:http";
import {Server, type Socket} from "socket.io";
import {RoomRegistry} from "./lib/room.js";
import {registerRoomHandlers} from "./lib/room-handlers.js";

const app = express()
const server = createServer(app);
const clientOrigins = (process.env.CLIENT_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: clientOrigins
    }
});

const port = Number(process.env.PORT ?? 3000);

const roomRegistry = new RoomRegistry()

const onConnection = (socket: Socket) => {
    console.log(socket.id);

    registerRoomHandlers(io, socket, roomRegistry);
}

io.on('connection', onConnection)

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
})