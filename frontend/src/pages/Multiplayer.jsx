import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const GRID_SIZE = 40;
const SOCKET_URL = 'http://localhost:5000';

const Multiplayer = () => {
    const canvasRef = useRef(null);
    const { user } = useAuthStore();
    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [inputRoomId, setInputRoomId] = useState('');
    const [gameState, setGameState] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, waiting, playing, gameover

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('roomUpdate', (room) => {
            setGameState(room);
            setStatus(room.status);
        });

        newSocket.on('gameStarted', () => {
            setStatus('playing');
        });

        newSocket.on('gameState', (state) => {
            setGameState(state);
            setStatus(state.status);
            renderGame(state);
        });

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (status !== 'playing' || !socket) return;
            
            let dir = null;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    dir = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    dir = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    dir = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    dir = { x: 1, y: 0 };
                    break;
            }
            if (dir) {
                socket.emit('move', dir);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, socket]);

    const renderGame = (state) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const size = canvas.width / GRID_SIZE;

        const drawRect = (x, y, color, glowColor) => {
            ctx.fillStyle = color;
            ctx.shadowBlur = glowColor ? 10 : 0;
            ctx.shadowColor = glowColor || 'transparent';
            // Make food round
            ctx.beginPath();
            ctx.arc(x * size + size/2, y * size + size/2, size/2 - 1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
        };

        const drawSnakeSegment = (x, y, index, color, glowColor, direction) => {
            const px = x * size;
            const py = y * size;
            const radius = size / 2;

            ctx.fillStyle = color;
            ctx.shadowBlur = glowColor ? 10 : 0;
            ctx.shadowColor = glowColor || 'transparent';

            ctx.beginPath();
            ctx.arc(px + radius, py + radius, radius - 1, 0, 2 * Math.PI);
            ctx.fill();
            
            if (index === 0 && direction) {
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

        // Draw Food
        if (state.food) {
            drawRect(state.food.x, state.food.y, '#ff00ff', '#ff00ff');
        }

        // Draw Players
        for (const pid in state.players) {
            const player = state.players[pid];
            if (!player.isAlive) continue;
            
            player.snake.forEach((segment, index) => {
                const isHead = index === 0;
                const isMe = pid === socket.id;
                
                let color = player.color;
                if (isMe && isHead) color = '#ffffff';
                
                drawSnakeSegment(segment.x, segment.y, index, color, color, player.direction);
            });
        }
    };

    const handleCreateRoom = () => {
        socket.emit('createRoom', { username: user.username }, (res) => {
            if (res.roomId) {
                setRoomId(res.roomId);
                toast.success(`Room created: ${res.roomId}`);
            }
        });
    };

    const handleJoinRoom = () => {
        if (!inputRoomId) return;
        socket.emit('joinRoom', { roomId: inputRoomId, username: user.username }, (res) => {
            if (res.error) {
                toast.error(res.error);
            } else {
                setRoomId(res.roomId);
                toast.success('Joined room!');
            }
        });
    };

    const handleStartGame = () => {
        socket.emit('startGame');
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] p-4 flex flex-col items-center">
            {status === 'idle' && (
                <div className="glass-card p-8 rounded-2xl max-w-md w-full border border-primary/20">
                    <h2 className="text-3xl font-bold mb-6 text-center text-primary neon-text-primary">MULTIPLAYER</h2>
                    
                    <button 
                        onClick={handleCreateRoom}
                        className="w-full py-3 mb-6 bg-primary/20 text-primary border border-primary hover:bg-primary/30 rounded-lg font-bold transition-all neon-box-primary"
                    >
                        CREATE ROOM
                    </button>

                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400">OR</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter Room Code"
                            value={inputRoomId}
                            onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-center tracking-widest uppercase focus:outline-none focus:border-secondary transition-colors"
                        />
                        <button 
                            onClick={handleJoinRoom}
                            className="w-full py-3 bg-secondary/20 text-secondary border border-secondary hover:bg-secondary/30 rounded-lg font-bold transition-all neon-box-secondary"
                        >
                            JOIN ROOM
                        </button>
                    </div>
                </div>
            )}

            {(status === 'waiting' || status === 'playing' || status === 'gameover') && (
                <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full">
                    <div className="flex-1 flex flex-col items-center">
                        <div className="mb-4 flex justify-between w-full">
                            <span className="text-xl font-bold text-primary">ROOM: {roomId}</span>
                            {status === 'waiting' && (
                                <button 
                                    onClick={handleStartGame}
                                    className="px-4 py-1 bg-green-500/20 text-green-500 border border-green-500 rounded font-bold hover:bg-green-500/30"
                                >
                                    START GAME
                                </button>
                            )}
                        </div>

                        <div className="relative p-1 bg-white/5 rounded-lg neon-box-primary border border-primary/30 w-full max-w-[600px] aspect-square">
                            <canvas
                                ref={canvasRef}
                                width={600}
                                height={600}
                                className="bg-black rounded-md w-full h-full"
                            />

                            {status === 'waiting' && (
                                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-md backdrop-blur-sm">
                                    <h2 className="text-3xl font-bold mb-4 neon-text-primary text-primary">WAITING FOR PLAYERS</h2>
                                    <p className="text-gray-400">Room Code: <span className="font-mono text-white text-xl">{roomId}</span></p>
                                </div>
                            )}

                            {status === 'gameover' && (
                                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-md backdrop-blur-sm">
                                    <h2 className="text-4xl font-bold mb-4 neon-text-secondary text-secondary">GAME OVER</h2>
                                    <button 
                                        onClick={() => {
                                            setStatus('idle');
                                            setRoomId('');
                                            setGameState(null);
                                        }}
                                        className="mt-6 px-6 py-2 bg-primary/20 text-primary border border-primary rounded-md hover:bg-primary/40 font-bold"
                                    >
                                        LEAVE ROOM
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-64">
                        <div className="glass-card p-4 rounded-xl border border-white/10 h-full">
                            <h3 className="font-bold mb-4 text-gray-400 border-b border-white/10 pb-2">PLAYERS</h3>
                            <div className="space-y-3">
                                {gameState?.players && Object.values(gameState.players).map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-white/5 p-2 rounded">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                                            <span className={`font-medium ${!p.isAlive && 'line-through text-gray-500'}`}>
                                                {p.username} {p.id === socket?.id && '(You)'}
                                            </span>
                                        </div>
                                        <span className="font-bold text-primary">{p.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Multiplayer;
