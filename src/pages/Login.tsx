import { useState } from 'react';
import { User, Lock, LogIn, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  t?: (key: string) => string;
}

const Login = ({ onLogin, onSignUp, t }: LoginProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) { setError('Please enter your name'); setLoading(false); return; }
        if (!email.trim()) { setError('Please enter your email'); setLoading(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        const { error } = await onSignUp(email, password, displayName);
        if (error) { setError(error.message); }
        else { setSignUpSuccess(true); }
      } else {
        if (!email.trim()) { setError('Please enter your email'); setLoading(false); return; }
        const { error } = await onLogin(email, password);
        if (error) { setError(error.message); }
      }
    } finally {
      setLoading(false);
    }
  };

  if (signUpSuccess) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-80 glass ios-shadow-lg rounded-2xl p-8 animate-scale-in text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Check your email</h2>
          <p className="text-sm text-muted-foreground mb-4">We sent a confirmation link to <strong>{email}</strong></p>
          <button onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }} className="text-sm text-primary hover:underline">
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-80 glass ios-shadow-lg rounded-2xl p-8 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">{t?.('welcome') || 'Study Dashboard'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isSignUp ? 'Create your account' : 'Sign in to continue'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Your name" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" autoFocus />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" autoFocus={!isSignUp} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-primary hover:underline">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
