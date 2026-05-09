import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Multiplayer from './pages/Multiplayer';
import SinglePlayer from './pages/SinglePlayer';
import Navbar from './components/Navbar';
import useAuthStore from './store/useAuthStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen grid-bg flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/singleplayer" element={<SinglePlayer />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/multiplayer" element={
              <ProtectedRoute>
                <Multiplayer />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: 'var(--card-bg)',
            color: '#fff',
            border: '1px solid var(--primary)',
          }
        }} />
      </div>
    </Router>
  );
}

export default App;
