import { create } from 'zustand';

const useGameStore = create((set) => ({
  gameState: null,
  socket: null,
  roomId: null,
  players: {},
  status: 'idle', // idle, waiting, playing, gameover
  
  setSocket: (socket) => set({ socket }),
  setRoomId: (roomId) => set({ roomId }),
  setGameState: (gameState) => set({ gameState }),
  setPlayers: (players) => set({ players }),
  setStatus: (status) => set({ status }),
  
  resetGame: () => set({
    gameState: null,
    roomId: null,
    players: {},
    status: 'idle'
  })
}));

export default useGameStore;
