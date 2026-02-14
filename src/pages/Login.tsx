import { useState } from 'react';
import { User, Lock, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string) => void;
}

// Simple local login page - iPhone/Apple style
const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }
    // Simple local authentication - no backend required
    localStorage.setItem('study-dashboard-user', username.trim());
    onLogin(username.trim());
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-80 glass ios-shadow-lg rounded-2xl p-8 animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Study Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>

          {/* Password (optional, cosmetic) */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password (optional)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
