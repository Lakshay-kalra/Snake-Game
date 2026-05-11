const GRID_SIZE = 40;
const INITIAL_SNAKE_LENGTH = 3;

const createRoom = () => {
    return {
        players: {},
        food: generateFood([]),
        pinkBallsEaten: 0,
        bigFood: null,
        bigFoodExpiresAt: 0,
        status: 'waiting', // waiting, playing, gameover
        countdown: 3
    };
};

const joinRoom = (room, socketId, username) => {
    room.players[socketId] = {
        id: socketId,
        username: username,
        snake: [
            { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }
        ],
        direction: { x: 0, y: -1 },
        nextDirection: { x: 0, y: -1 },
        score: 0,
        color: getRandomColor(),
        isAlive: true
    };
    // Initialize snake body
    for (let i = 1; i < INITIAL_SNAKE_LENGTH; i++) {
        room.players[socketId].snake.push({
            x: room.players[socketId].snake[0].x,
            y: room.players[socketId].snake[0].y + i
        });
    }
};

const getRandomColor = () => {
    const colors = ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#0000ff'];
    return colors[Math.floor(Math.random() * colors.length)];
};

const generateFood = (players, existingFood = null) => {
    let newFood;
    let valid = false;
    while (!valid) {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        valid = true;
        // Ensure food doesn't spawn on any snake
        for (const playerId in players) {
            const player = players[playerId];
            for (const segment of player.snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    valid = false;
                    break;
                }
            }
            if (!valid) break;
        }
        if (valid && existingFood && existingFood.x === newFood.x && existingFood.y === newFood.y) {
            valid = false;
        }
    }
    return newFood;
};

const updateGame = (room) => {
    if (room.status !== 'playing') return;

    let aliveCount = 0;

    for (const playerId in room.players) {
        const player = room.players[playerId];
        if (!player.isAlive) continue;
        aliveCount++;

        player.direction = player.nextDirection;
        const head = { ...player.snake[0] };
        head.x += player.direction.x;
        head.y += player.direction.y;

        // Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            player.isAlive = false;
            continue;
        }

        // Self Collision
        for (const segment of player.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                player.isAlive = false;
                break;
            }
        }
        if (!player.isAlive) continue;

        // Enemy Collision
        for (const otherId in room.players) {
            if (otherId === playerId) continue;
            const otherPlayer = room.players[otherId];
            if (!otherPlayer.isAlive) continue;
            for (const segment of otherPlayer.snake) {
                if (head.x === segment.x && head.y === segment.y) {
                    player.isAlive = false;
                    break;
                }
            }
            if (!player.isAlive) break;
        }
        if (!player.isAlive) continue;

        player.snake.unshift(head);

        // Food Collision
        if (head.x === room.food.x && head.y === room.food.y) {
            player.score += 10;
            room.pinkBallsEaten = (room.pinkBallsEaten || 0) + 1;
            room.food = generateFood(room.players, room.bigFood);
            
            if (room.pinkBallsEaten % 5 === 0) {
                room.bigFood = generateFood(room.players, room.food);
                room.bigFoodExpiresAt = Date.now() + 5000;
            }
        } else if (room.bigFood && head.x === room.bigFood.x && head.y === room.bigFood.y) {
            player.score += 20;
            room.bigFood = null;
        } else {
            player.snake.pop();
        }
    }

    if (room.bigFood && Date.now() > room.bigFoodExpiresAt) {
        room.bigFood = null;
    }

    if (Object.keys(room.players).length > 1 && aliveCount <= 1) {
        room.status = 'gameover';
    } else if (Object.keys(room.players).length === 1 && aliveCount === 0) {
        room.status = 'gameover';
    }
};

module.exports = { createRoom, joinRoom, updateGame, GRID_SIZE };
