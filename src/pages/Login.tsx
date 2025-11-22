import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Flame } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
          <div className="bg-gradient-to-r from-[#ff5555] to-[#ff9500] rounded-full p-4 mb-4 shadow-lg shadow-[#ff5555]/50">
            <Flame className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff5555] to-[#ff9500] bg-clip-text text-transparent">
            BeProudly
          </h1>
          <p className="text-white/70 mt-2">Video dating for LGBTQ+ community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff5555]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#ff5555] hover:text-[#ff9500] font-medium transition"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
