import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GRID_SIZE = 40;
const INITIAL_SPEED = 100; // ms

const SinglePlayer = () => {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const navigate = useNavigate();

    // Game state refs (to avoid stale closures in requestAnimationFrame)
    const stateRef = useRef({
        snake: [{ x: 20, y: 20 }, { x: 20, y: 21 }, { x: 20, y: 22 }],
        direction: { x: 0, y: -1 },
        nextDirection: { x: 0, y: -1 },
        food: { x: 10, y: 10 },
        lastRenderTime: 0,
        speed: INITIAL_SPEED
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            const { direction, nextDirection } = stateRef.current;
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
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const generateFood = (snake) => {
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
        }
        return newFood;
    };

    const resetGame = () => {
        stateRef.current = {
            snake: [{ x: 20, y: 20 }, { x: 20, y: 21 }, { x: 20, y: 22 }],
            direction: { x: 0, y: -1 },
            nextDirection: { x: 0, y: -1 },
            food: generateFood([{ x: 20, y: 20 }, { x: 20, y: 21 }, { x: 20, y: 22 }]),
            lastRenderTime: 0,
            speed: INITIAL_SPEED
        };
        setScore(0);
        setGameOver(false);
        setIsPaused(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const drawRect = (x, y, color, glowColor) => {
            const size = canvas.width / GRID_SIZE;
            ctx.fillStyle = color;
            ctx.shadowBlur = glowColor ? 10 : 0;
            ctx.shadowColor = glowColor || 'transparent';
            // Make food round
            ctx.beginPath();
            ctx.arc(x * size + size/2, y * size + size/2, size/2 - 1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        };

        const drawSnakeSegment = (x, y, index, color, glowColor) => {
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
            
            // If it's the head, draw eyes and tongue
            if (index === 0) {
                const { direction } = stateRef.current;
                ctx.shadowBlur = 0; // Reset shadow for details
                
                // Eyes
                ctx.fillStyle = '#000000';
                const eyeRadius = size / 6;
                let eye1X, eye1Y, eye2X, eye2Y;
                
                if (direction.x !== 0) {
                    // Moving horizontally
                    eye1X = px + radius + (direction.x * size * 0.2);
                    eye1Y = py + radius - size * 0.25;
                    eye2X = px + radius + (direction.x * size * 0.2);
                    eye2Y = py + radius + size * 0.25;
                } else {
                    // Moving vertically
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
                const tongueFlick = (Date.now() % 400 > 200) ? 3 : -3; // simple flick
                
                if (direction.x === 1) { // Right
                    ctx.moveTo(px + size, py + radius);
                    ctx.lineTo(px + size + size * 0.3, py + radius);
                    ctx.lineTo(px + size + size * 0.5, py + radius + tongueFlick);
                    ctx.moveTo(px + size + size * 0.3, py + radius);
                    ctx.lineTo(px + size + size * 0.5, py + radius - tongueFlick);
                } else if (direction.x === -1) { // Left
                    ctx.moveTo(px, py + radius);
                    ctx.lineTo(px - size * 0.3, py + radius);
                    ctx.lineTo(px - size * 0.5, py + radius + tongueFlick);
                    ctx.moveTo(px - size * 0.3, py + radius);
                    ctx.lineTo(px - size * 0.5, py + radius - tongueFlick);
                } else if (direction.y === 1) { // Down
                    ctx.moveTo(px + radius, py + size);
                    ctx.lineTo(px + radius, py + size + size * 0.3);
                    ctx.lineTo(px + radius + tongueFlick, py + size + size * 0.5);
                    ctx.moveTo(px + radius, py + size + size * 0.3);
                    ctx.lineTo(px + radius - tongueFlick, py + size + size * 0.5);
                } else if (direction.y === -1) { // Up
                    ctx.moveTo(px + radius, py);
                    ctx.lineTo(px + radius, py - size * 0.3);
                    ctx.lineTo(px + radius + tongueFlick, py - size * 0.5);
                    ctx.moveTo(px + radius, py - size * 0.3);
                    ctx.lineTo(px + radius - tongueFlick, py - size * 0.5);
                }
                ctx.stroke();
            }

            ctx.shadowBlur = 0; // reset
        };

        const render = () => {
            // Clear canvas
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const { snake, food } = stateRef.current;

            // Draw Food
            drawRect(food.x, food.y, '#ff00ff', '#ff00ff');

            // Draw Snake
            snake.forEach((segment, index) => {
                const color = index === 0 ? '#ffffff' : '#00ff00';
                const glow = index === 0 ? '#ffffff' : '#00ff00';
                drawSnakeSegment(segment.x, segment.y, index, color, glow);
            });
        };

        const update = (time) => {
            if (gameOver || isPaused) return;

            const secondsSinceLastRender = (time - stateRef.current.lastRenderTime);
            if (secondsSinceLastRender < stateRef.current.speed) {
                animationFrameId = requestAnimationFrame(gameLoop);
                return;
            }

            stateRef.current.lastRenderTime = time;

            stateRef.current.direction = stateRef.current.nextDirection;
            const head = { ...stateRef.current.snake[0] };
            head.x += stateRef.current.direction.x;
            head.y += stateRef.current.direction.y;

            // Wall collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                setGameOver(true);
                return;
            }

            // Self collision
            for (let segment of stateRef.current.snake) {
                if (segment.x === head.x && segment.y === head.y) {
                    setGameOver(true);
                    return;
                }
            }

            stateRef.current.snake.unshift(head);

            // Food collision
            if (head.x === stateRef.current.food.x && head.y === stateRef.current.food.y) {
                setScore(s => s + 10);
                stateRef.current.food = generateFood(stateRef.current.snake);
                // Increase speed
                if (stateRef.current.speed > 40) {
                    stateRef.current.speed -= 2;
                }
            } else {
                stateRef.current.snake.pop();
            }

            render();
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        const gameLoop = (time) => {
            update(time);
        };

        // Initial render
        render();
        animationFrameId = requestAnimationFrame(gameLoop);

        return () => cancelAnimationFrame(animationFrameId);
    }, [gameOver, isPaused]);

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
            <div className="glass-card p-6 rounded-2xl max-w-4xl w-full flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex flex-col items-center">
                    <div className="mb-4 flex justify-between w-full text-xl font-bold">
                        <span className="text-primary neon-text-primary">SCORE: {score}</span>
                    </div>
                    
                    <div className="relative p-1 bg-white/5 rounded-lg neon-box-primary border border-primary/30">
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={600}
                            className="bg-black rounded-md w-full max-w-[600px] aspect-square"
                        />
                        
                        {(gameOver || isPaused) && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-md backdrop-blur-sm">
                                <h2 className="text-4xl font-bold mb-4 neon-text-secondary text-secondary">
                                    {gameOver ? 'GAME OVER' : 'PAUSED'}
                                </h2>
                                <p className="text-2xl mb-6">Final Score: {score}</p>
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

export default SinglePlayer;
