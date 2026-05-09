import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, User, LogOut } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed w-full z-50 glass-card border-b-0 border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Gamepad2 className="w-8 h-8 text-primary neon-text-primary" />
            <span className="font-bold text-xl tracking-wider text-white">
              SNAKE<span className="text-primary">.io</span>
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link to="/multiplayer" className="text-gray-300 hover:text-white transition-colors">
                  Multiplayer
                </Link>
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user?.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 px-4 py-2 rounded-md transition-all font-medium neon-box-primary"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
