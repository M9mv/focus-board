import { useState } from 'react';
import { LogIn } from 'lucide-react';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);


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
