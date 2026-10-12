import express from 'express';
import {helloWorld} from "@wp/shared";
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

io.on('connection', (socket) => {
    console.log(socket.id);

    socket.on('room:create', (cb) => {
        const roomCode = roomRegistry.createRoom(socket.id);

        if (roomCode) {
            cb(roomCode);
        }
    })
})

server.listen(3000, () => {
    console.log('Server started on port 3000');
    helloWorld();
})