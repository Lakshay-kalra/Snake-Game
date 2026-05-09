const { createRoom, joinRoom, updateGame } = require('./gameLogic');

const rooms = {};
const playerRoomMap = {};

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('createRoom', (data, callback) => {
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            rooms[roomId] = createRoom();
            joinRoom(rooms[roomId], socket.id, data.username);
            playerRoomMap[socket.id] = roomId;
            socket.join(roomId);
            
            if (callback) callback({ roomId });
            io.to(roomId).emit('roomUpdate', rooms[roomId]);
        });

        socket.on('joinRoom', (data, callback) => {
            const { roomId, username } = data;
            if (rooms[roomId]) {
                if (rooms[roomId].status === 'playing') {
                    if (callback) callback({ error: 'Game already in progress' });
                    return;
                }
                joinRoom(rooms[roomId], socket.id, username);
                playerRoomMap[socket.id] = roomId;
                socket.join(roomId);
                if (callback) callback({ roomId });
                io.to(roomId).emit('roomUpdate', rooms[roomId]);
            } else {
                if (callback) callback({ error: 'Room not found' });
            }
        });

        socket.on('startGame', () => {
            const roomId = playerRoomMap[socket.id];
            if (roomId && rooms[roomId] && rooms[roomId].status === 'waiting') {
                rooms[roomId].status = 'playing';
                io.to(roomId).emit('gameStarted');
            }
        });

        socket.on('move', (dir) => {
            const roomId = playerRoomMap[socket.id];
            if (roomId && rooms[roomId]) {
                const player = rooms[roomId].players[socket.id];
                if (player && player.isAlive) {
                    // Prevent reverse movement
                    if ((dir.x === 1 && player.direction.x !== -1) ||
                        (dir.x === -1 && player.direction.x !== 1) ||
                        (dir.y === 1 && player.direction.y !== -1) ||
                        (dir.y === -1 && player.direction.y !== 1)) {
                        player.nextDirection = dir;
                    }
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            const roomId = playerRoomMap[socket.id];
            if (roomId && rooms[roomId]) {
                delete rooms[roomId].players[socket.id];
                delete playerRoomMap[socket.id];
                if (Object.keys(rooms[roomId].players).length === 0) {
                    delete rooms[roomId];
                } else {
                    io.to(roomId).emit('roomUpdate', rooms[roomId]);
                }
            }
        });
    });

    // Game loop
    setInterval(() => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.status === 'playing') {
                updateGame(room);
                io.to(roomId).emit('gameState', room);
            }
        }
    }, 1000 / 10); // 10 ticks per second
};
