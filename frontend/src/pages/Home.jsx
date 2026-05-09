import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Users, Trophy, Cpu } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl"
      >
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
          CYBER<span className="text-primary neon-text-primary">SNAKE</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Experience the classic game reimagined for the modern web. 
          Real-time multiplayer, global leaderboards, and stunning neon aesthetics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Link to="/singleplayer" className="group">
            <div className="glass-card p-6 rounded-xl border border-primary/20 hover:border-primary/60 transition-all hover:neon-box-primary">
              <Gamepad2 className="w-12 h-12 text-primary mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Single Player</h3>
              <p className="text-gray-400 text-sm">Practice offline or beat your own high score.</p>
            </div>
          </Link>
          
          <Link to="/multiplayer" className="group">
            <div className="glass-card p-6 rounded-xl border border-secondary/20 hover:border-secondary/60 transition-all hover:neon-box-secondary">
              <Users className="w-12 h-12 text-secondary mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Multiplayer</h3>
              <p className="text-gray-400 text-sm">Battle against others in real-time arenas.</p>
            </div>
          </Link>

          <Link to="/leaderboard" className="group">
            <div className="glass-card p-6 rounded-xl border border-accent/20 hover:border-accent/60 transition-all hover:neon-box-primary">
              <Trophy className="w-12 h-12 text-accent mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Leaderboard</h3>
              <p className="text-gray-400 text-sm">Check the global rankings and top players.</p>
            </div>
          </Link>

          <Link to="/ai-bot" className="group">
            <div className="glass-card p-6 rounded-xl border border-white/20 hover:border-white/60 transition-all">
              <Cpu className="w-12 h-12 text-white mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Vs AI</h3>
              <p className="text-gray-400 text-sm">Challenge advanced AI bots.</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
