import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GRID_SIZE = 40;
const INITIAL_SPEED = 100; // ms

const AIBot = () => {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [winnerText, setWinnerText] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const navigate = useNavigate();

    // Game state refs (to avoid stale closures in requestAnimationFrame)
    const stateRef = useRef({
        snake: [{ x: 10, y: 20 }, { x: 10, y: 21 }, { x: 10, y: 22 }],
        direction: { x: 0, y: -1 },
        nextDirection: { x: 0, y: -1 },
        
        aiSnake: [{ x: 30, y: 20 }, { x: 30, y: 21 }, { x: 30, y: 22 }],
        aiDirection: { x: 0, y: -1 },
        
        food: { x: 20, y: 20 },
        pinkBallsEaten: 0,
        bigFood: null,
        bigFoodExpiresAt: 0,
        lastRenderTime: 0,
        speed: INITIAL_SPEED
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            const { direction } = stateRef.current;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (direction.y !== 1) stateRef.current.nextDirection = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (direction.y !== -1) stateRef.current.nextDirection = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (direction.x !== 1) stateRef.current.nextDirection = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (direction.x !== -1) stateRef.current.nextDirection = { x: 1, y: 0 };
                    break;
                case 'Escape':
                    setIsPaused(prev => !prev);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const generateFood = (snake, aiSnake, existingFood = null) => {
        let valid = false;
        let newFood = { x: 0, y: 0 };
        while (!valid) {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            valid = true;
            for (let segment of snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    valid = false;
                    break;
                }
            }
            if (!valid) continue;

            for (let segment of aiSnake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    valid = false;
                    break;
                }
            }
            
            if (valid && existingFood && existingFood.x === newFood.x && existingFood.y === newFood.y) {
                valid = false;
            }
        }
        return newFood;
    };

    const resetGame = () => {
        stateRef.current = {
            snake: [{ x: 10, y: 20 }, { x: 10, y: 21 }, { x: 10, y: 22 }],
            direction: { x: 0, y: -1 },
            nextDirection: { x: 0, y: -1 },
            
            aiSnake: [{ x: 30, y: 20 }, { x: 30, y: 21 }, { x: 30, y: 22 }],
            aiDirection: { x: 0, y: -1 },
            
            food: generateFood([{ x: 10, y: 20 }, { x: 10, y: 21 }, { x: 10, y: 22 }], [{ x: 30, y: 20 }, { x: 30, y: 21 }, { x: 30, y: 22 }]),
            pinkBallsEaten: 0,
            bigFood: null,
            bigFoodExpiresAt: 0,
            lastRenderTime: 0,
            speed: INITIAL_SPEED
        };
        setScore(0);
        setAiScore(0);
        setGameOver(false);
        setWinnerText('');
        setIsPaused(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const drawRect = (x, y, color, glowColor, sizeMultiplier = 1) => {
            const size = canvas.width / GRID_SIZE;
            ctx.fillStyle = color;
            ctx.shadowBlur = glowColor ? 10 : 0;
            ctx.shadowColor = glowColor || 'transparent';
            ctx.beginPath();
            ctx.arc(x * size + size/2, y * size + size/2, (size/2 - 1) * sizeMultiplier, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
        };

        const drawSnakeSegment = (x, y, index, color, glowColor, direction) => {
            const size = canvas.width / GRID_SIZE;
            const px = x * size;
            const py = y * size;
            const radius = size / 2;

            ctx.fillStyle = color;
            ctx.shadowBlur = glowColor ? 10 : 0;
            ctx.shadowColor = glowColor || 'transparent';

            ctx.beginPath();
            ctx.arc(px + radius, py + radius, radius - 1, 0, 2 * Math.PI);
            ctx.fill();
            
            if (index === 0) {
                ctx.shadowBlur = 0;
                
                // Eyes
                ctx.fillStyle = '#000000';
                const eyeRadius = size / 6;
                let eye1X, eye1Y, eye2X, eye2Y;
                
                if (direction.x !== 0) {
                    eye1X = px + radius + (direction.x * size * 0.2);
                    eye1Y = py + radius - size * 0.25;
                    eye2X = px + radius + (direction.x * size * 0.2);
                    eye2Y = py + radius + size * 0.25;
                } else {
                    eye1X = px + radius - size * 0.25;
                    eye1Y = py + radius + (direction.y * size * 0.2);
                    eye2X = px + radius + size * 0.25;
                    eye2Y = py + radius + (direction.y * size * 0.2);
                }
                
                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, eyeRadius, 0, 2 * Math.PI);
                ctx.arc(eye2X, eye2Y, eyeRadius, 0, 2 * Math.PI);
                ctx.fill();

                // Tongue
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                const tongueFlick = (Date.now() % 400 > 200) ? 3 : -3;
                
                if (direction.x === 1) {
                    ctx.moveTo(px + size, py + radius);
                    ctx.lineTo(px + size + size * 0.3, py + radius);
                    ctx.lineTo(px + size + size * 0.5, py + radius + tongueFlick);
                    ctx.moveTo(px + size + size * 0.3, py + radius);
                    ctx.lineTo(px + size + size * 0.5, py + radius - tongueFlick);
                } else if (direction.x === -1) {
                    ctx.moveTo(px, py + radius);
                    ctx.lineTo(px - size * 0.3, py + radius);
                    ctx.lineTo(px - size * 0.5, py + radius + tongueFlick);
                    ctx.moveTo(px - size * 0.3, py + radius);
                    ctx.lineTo(px - size * 0.5, py + radius - tongueFlick);
                } else if (direction.y === 1) {
                    ctx.moveTo(px + radius, py + size);
                    ctx.lineTo(px + radius, py + size + size * 0.3);
                    ctx.lineTo(px + radius + tongueFlick, py + size + size * 0.5);
                    ctx.moveTo(px + radius, py + size + size * 0.3);
                    ctx.lineTo(px + radius - tongueFlick, py + size + size * 0.5);
                } else if (direction.y === -1) {
                    ctx.moveTo(px + radius, py);
                    ctx.lineTo(px + radius, py - size * 0.3);
                    ctx.lineTo(px + radius + tongueFlick, py - size * 0.5);
                    ctx.moveTo(px + radius, py - size * 0.3);
                    ctx.lineTo(px + radius - tongueFlick, py - size * 0.5);
                }
                ctx.stroke();
            }

            ctx.shadowBlur = 0;
        };

        const render = () => {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const { snake, aiSnake, food, bigFood, direction, aiDirection } = stateRef.current;

            // Draw Food
            drawRect(food.x, food.y, '#ff00ff', '#ff00ff');

            // Draw Big Food
            if (bigFood) {
                drawRect(bigFood.x, bigFood.y, '#ffaa00', '#ffaa00', 1.8);
            }

            // Draw Player Snake
            snake.forEach((segment, index) => {
                const color = index === 0 ? '#ffffff' : '#00ff00';
                const glow = index === 0 ? '#ffffff' : '#00ff00';
                drawSnakeSegment(segment.x, segment.y, index, color, glow, direction);
            });

            // Draw AI Snake
            aiSnake.forEach((segment, index) => {
                const color = index === 0 ? '#ffffff' : '#00ffff';
                const glow = index === 0 ? '#ffffff' : '#00ffff';
                drawSnakeSegment(segment.x, segment.y, index, color, glow, aiDirection);
            });
        };

        const update = (time) => {
            if (gameOver || isPaused) return;

            const msSinceLastRender = (time - stateRef.current.lastRenderTime);
            if (msSinceLastRender < stateRef.current.speed) {
                animationFrameId = requestAnimationFrame(gameLoop);
                return;
            }

            stateRef.current.lastRenderTime = time;

            // Update Player Direction
            stateRef.current.direction = stateRef.current.nextDirection;
            const head = { ...stateRef.current.snake[0] };
            head.x += stateRef.current.direction.x;
            head.y += stateRef.current.direction.y;

            // AI Logic
            const headAI = { ...stateRef.current.aiSnake[0] };
            const target = stateRef.current.bigFood || stateRef.current.food;
            let possibleMoves = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
            ];
            
            const currentAiDir = stateRef.current.aiDirection;
            possibleMoves = possibleMoves.filter(m => !(m.x === -currentAiDir.x && m.y === -currentAiDir.y));

            const isSafe = (move) => {
                const nextX = headAI.x + move.x;
                const nextY = headAI.y + move.y;
                if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) return false;
                for (let segment of stateRef.current.aiSnake) {
                    if (segment.x === nextX && segment.y === nextY) return false;
                }
                for (let segment of stateRef.current.snake) {
                    // Avoid player's body and where player might be next (simplification: just avoid body)
                    if (segment.x === nextX && segment.y === nextY) return false;
                }
                return true;
            };

            const safeMoves = possibleMoves.filter(isSafe);
            let bestMove = null;
            let minDistance = Infinity;

            for (let move of safeMoves) {
                const nextX = headAI.x + move.x;
                const nextY = headAI.y + move.y;
                const distance = Math.abs(nextX - target.x) + Math.abs(nextY - target.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestMove = move;
                }
            }

            if (bestMove) {
                stateRef.current.aiDirection = bestMove;
            } else if (safeMoves.length > 0) {
                stateRef.current.aiDirection = safeMoves[0];
            }

            headAI.x += stateRef.current.aiDirection.x;
            headAI.y += stateRef.current.aiDirection.y;

            // Check collisions
            let playerDied = false;
            let aiDied = false;

            // Wall collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) playerDied = true;
            if (headAI.x < 0 || headAI.x >= GRID_SIZE || headAI.y < 0 || headAI.y >= GRID_SIZE) aiDied = true;

            // Self collision
            for (let segment of stateRef.current.snake) {
                if (segment.x === head.x && segment.y === head.y) playerDied = true;
            }
            for (let segment of stateRef.current.aiSnake) {
                if (segment.x === headAI.x && segment.y === headAI.y) aiDied = true;
            }

            // Cross collision
            for (let segment of stateRef.current.aiSnake) {
                if (segment.x === head.x && segment.y === head.y) playerDied = true;
            }
            for (let segment of stateRef.current.snake) {
                if (segment.x === headAI.x && segment.y === headAI.y) aiDied = true;
            }

            // Head to head collision
            if (head.x === headAI.x && head.y === headAI.y) {
                playerDied = true;
                aiDied = true;
            }

            if (playerDied || aiDied) {
                if (playerDied && aiDied) setWinnerText('Draw!');
                else if (playerDied) setWinnerText('AI Wins!');
                else setWinnerText('You Win!');
                setGameOver(true);
                return;
            }

            stateRef.current.snake.unshift(head);
            stateRef.current.aiSnake.unshift(headAI);

            // Food collision Player
            let playerAte = false;
            if (head.x === stateRef.current.food.x && head.y === stateRef.current.food.y) {
                setScore(s => s + 10);
                stateRef.current.pinkBallsEaten++;
                playerAte = true;
            } else if (stateRef.current.bigFood && head.x === stateRef.current.bigFood.x && head.y === stateRef.current.bigFood.y) {
                setScore(s => s + 20);
                stateRef.current.bigFood = null;
            } else {
                stateRef.current.snake.pop();
            }

            // Food collision AI
            let aiAte = false;
            if (!playerAte && headAI.x === stateRef.current.food.x && headAI.y === stateRef.current.food.y) {
                setAiScore(s => s + 10);
                stateRef.current.pinkBallsEaten++;
                aiAte = true;
            } else if (!playerAte && stateRef.current.bigFood && headAI.x === stateRef.current.bigFood.x && headAI.y === stateRef.current.bigFood.y) {
                setAiScore(s => s + 20);
                stateRef.current.bigFood = null;
            } else {
                stateRef.current.aiSnake.pop();
            }

            if (playerAte || aiAte) {
                stateRef.current.food = generateFood(stateRef.current.snake, stateRef.current.aiSnake, stateRef.current.bigFood);
                
                if (stateRef.current.pinkBallsEaten % 5 === 0) {
                    stateRef.current.bigFood = generateFood(stateRef.current.snake, stateRef.current.aiSnake, stateRef.current.food);
                    stateRef.current.bigFoodExpiresAt = time + 5000;
                }

                if (stateRef.current.speed > 40) {
                    stateRef.current.speed -= 2;
                }
            }

            if (stateRef.current.bigFood && time > stateRef.current.bigFoodExpiresAt) {
                stateRef.current.bigFood = null;
            }

            render();
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        const gameLoop = (time) => {
            update(time);
        };

        render();
        animationFrameId = requestAnimationFrame(gameLoop);

        return () => cancelAnimationFrame(animationFrameId);
    }, [gameOver, isPaused]);

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
            <div className="glass-card p-6 rounded-2xl max-w-4xl w-full flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex flex-col items-center">
                    <div className="mb-4 flex justify-between w-full text-xl font-bold">
                        <span className="text-primary neon-text-primary">YOU: {score}</span>
                        <span className="text-[#00ffff] font-bold" style={{ textShadow: '0 0 10px #00ffff' }}>AI: {aiScore}</span>
                    </div>
                    
                    <div className="relative p-1 bg-white/5 rounded-lg border border-white/30">
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={600}
                            className="bg-black rounded-md w-full max-w-[600px] aspect-square"
                        />
                        
                        {(gameOver || isPaused) && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-md backdrop-blur-sm">
                                <h2 className="text-4xl font-bold mb-4 text-white neon-text-primary">
                                    {gameOver ? winnerText : 'PAUSED'}
                                </h2>
                                <p className="text-2xl mb-6">You: {score} - AI: {aiScore}</p>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={resetGame}
                                        className="px-6 py-2 bg-primary/20 text-primary border border-primary rounded-md hover:bg-primary/40 transition-colors font-bold"
                                    >
                                        {gameOver ? 'PLAY AGAIN' : 'RESUME'}
                                    </button>
                                    <button 
                                        onClick={() => navigate('/')}
                                        className="px-6 py-2 bg-white/10 text-white border border-white/30 rounded-md hover:bg-white/20 transition-colors"
                                    >
                                        QUIT
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="w-full md:w-64 flex flex-col gap-4">
                    <div className="glass-card p-4 rounded-xl border border-white/10">
                        <h3 className="font-bold mb-2 text-gray-400">CONTROLS</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-white/5 p-2 text-center rounded">W / ↑</div>
                            <div className="bg-white/5 p-2 text-center rounded">Move Up</div>
                            <div className="bg-white/5 p-2 text-center rounded">S / ↓</div>
                            <div className="bg-white/5 p-2 text-center rounded">Move Down</div>
                            <div className="bg-white/5 p-2 text-center rounded">A / ←</div>
                            <div className="bg-white/5 p-2 text-center rounded">Move Left</div>
                            <div className="bg-white/5 p-2 text-center rounded">D / →</div>
                            <div className="bg-white/5 p-2 text-center rounded">Move Right</div>
                            <div className="bg-white/5 p-2 text-center rounded">ESC</div>
                            <div className="bg-white/5 p-2 text-center rounded">Pause</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIBot;
