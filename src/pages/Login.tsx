import { useState } from 'react';
import { LogIn, Chrome, Apple } from 'lucide-react';

interface LoginProps {
  onGoogleLogin: () => Promise<{ error: any }>;
  onAppleLogin: () => Promise<{ error: any }>;
  t?: (key: string) => string;
}

const Login = ({ onGoogleLogin, onAppleLogin, t }: LoginProps) => {
  const [error, setError] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);

  const handleProviderLogin = async (provider: 'google' | 'apple') => {
    setError('');
    setLoadingProvider(provider);

    const { error: authError } = provider === 'google' ? await onGoogleLogin() : await onAppleLogin();

    if (authError) {
      setError(authError.message || 'Failed to sign in');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm glass ios-shadow-lg rounded-2xl p-8 animate-scale-in border border-border/70">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-card/80 border border-border flex items-center justify-center mb-4 ios-shadow-sm overflow-hidden">
            <img src="/favicon.ico" alt="Logo" className="w-12 h-12 object-contain" loading="lazy" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{t?.('welcome') || 'Welcome'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t?.('startStudying') || 'Sign in to continue'}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleProviderLogin('google')}
            disabled={loadingProvider !== null}
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Chrome className="w-4 h-4" />
            {loadingProvider === 'google' ? '...' : 'Continue with Google'}
          </button>

          <button
            onClick={() => handleProviderLogin('apple')}
            disabled={loadingProvider !== null}
            className="w-full py-3 px-4 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Apple className="w-4 h-4" />
            {loadingProvider === 'apple' ? '...' : 'Continue with Apple'}
          </button>
        </div>

        {error && <p className="text-xs text-destructive mt-4 text-center">{error}</p>}

        <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <LogIn className="w-3.5 h-3.5" />
          Secure social login
        </div>
      </div>
    </div>
  );
};

export default Login;
