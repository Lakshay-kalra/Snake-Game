import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Trophy, Gamepad2, Skull, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <div className="glass-card p-6 rounded-2xl border border-primary/20 text-center h-full">
            <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 border-2 border-primary shadow-[0_0_15px_rgba(0,255,0,0.5)]">
              <span className="text-5xl uppercase font-bold text-primary">{user.username.charAt(0)}</span>
            </div>
            <h2 className="text-2xl font-bold neon-text-primary text-primary mb-1">{user.username}</h2>
            <p className="text-gray-400 mb-4">{user.email}</p>
            <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <Medal className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="font-bold text-yellow-400">{user.rank || 'Bronze'}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="glass-card p-6 rounded-xl border border-secondary/20 flex flex-col justify-center">
            <Trophy className="w-8 h-8 text-secondary mb-2" />
            <h3 className="text-gray-400 font-medium">Highest Score</h3>
            <p className="text-4xl font-bold text-secondary neon-text-secondary">{user.highestScore || 0}</p>
          </div>
          
          <div className="glass-card p-6 rounded-xl border border-accent/20 flex flex-col justify-center">
            <Gamepad2 className="w-8 h-8 text-accent mb-2" />
            <h3 className="text-gray-400 font-medium">Matches Played</h3>
            <p className="text-4xl font-bold text-accent neon-text-accent">{user.matchesPlayed || 0}</p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-green-500/20 flex flex-col justify-center">
            <Trophy className="w-8 h-8 text-green-500 mb-2" />
            <h3 className="text-gray-400 font-medium">Wins</h3>
            <p className="text-4xl font-bold text-green-500">{user.wins || 0}</p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-red-500/20 flex flex-col justify-center">
            <Skull className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="text-gray-400 font-medium">Losses</h3>
            <p className="text-4xl font-bold text-red-500">{user.losses || 0}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10">
        <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/singleplayer" className="px-6 py-3 bg-primary/20 text-primary border border-primary hover:bg-primary/30 transition-all rounded-lg font-bold flex items-center gap-2">
            <Gamepad2 /> Play Single Player
          </Link>
          <Link to="/multiplayer" className="px-6 py-3 bg-secondary/20 text-secondary border border-secondary hover:bg-secondary/30 transition-all rounded-lg font-bold flex items-center gap-2">
            <Trophy /> Join Multiplayer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
