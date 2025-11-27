import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Flame } from 'lucide-react';
import { validateEmail, validatePassword } from '../utils/validation';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleTestLogin = () => {
    setEmail('test@beproudly.com');
    setPassword('testpassword123');
    setIsLogin(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isLogin) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.error || 'Invalid password');
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center p-4">
      <div className="bg-[#2a2a2a] rounded-3xl shadow-2xl border border-[#ff5555]/20 p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="bg-gradient-to-r from-[#ff5555] to-[#ff9500] rounded-full p-4 mb-4 shadow-lg shadow-[#ff5555]/50"
            aria-hidden="true"
          >
            <Flame className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff5555] to-[#ff9500] bg-clip-text text-transparent">
            BeProudly
          </h1>
          <p className="text-white/70 mt-2">Video dating for LGBTQ+ community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label={isLogin ? 'Sign in form' : 'Sign up form'}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
              placeholder="your@email.com"
              required
              disabled={loading}
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              Password {!isLogin && <span className="text-white/50 text-xs">(min. 8 characters)</span>}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
              placeholder="••••••••"
              required
              minLength={8}
              disabled={loading}
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          {error && (
            <div
              id="login-error"
              className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff5555]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isLogin ? 'Sign in to your account' : 'Create new account'}
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            disabled={loading}
            className="text-[#ff5555] hover:text-[#ff9500] font-medium transition disabled:opacity-50"
            aria-label={isLogin ? 'Switch to sign up form' : 'Switch to sign in form'}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-[#ff5555]/20">
          <div className="text-center mb-3">
            <p className="text-white/50 text-xs mb-2">Test Credentials</p>
            <div className="bg-[#1a1a1a] rounded-lg p-3 mb-3 border border-[#ff5555]/20">
              <p className="text-white/70 text-xs mb-1">
                <span className="text-white/50">Email:</span> test@beproudly.com
              </p>
              <p className="text-white/70 text-xs">
                <span className="text-white/50">Password:</span> testpassword123
              </p>
            </div>
          </div>
          <button
            onClick={handleTestLogin}
            disabled={loading}
            className="w-full bg-[#3a3a3a] text-white/90 py-2 rounded-xl text-sm font-medium hover:bg-[#4a4a4a] transition disabled:opacity-50 border border-[#ff5555]/20"
            aria-label="Fill test credentials"
          >
            Use Test Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
