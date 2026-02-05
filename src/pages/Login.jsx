
import { Chrome, Fingerprint, Mail, Moon, Shield, Sun, User, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

export default function Login() {
  const [method, setMethod] = useState('password'); // 'password' | 'magic'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
        navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      const match = error.match(/Try again in (\d+) seconds/);
      if (match) {
        const seconds = parseInt(match[1], 10);
        if (seconds > 0) {
          const timer = setTimeout(() => {
            setError((prev) => prev.replace(/in \d+ seconds/, `in ${seconds - 1} seconds`));
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      if (method === 'magic') {
          await api.post('/auth/request-magic-link', { email: email.toLowerCase().trim() });
          setInfo('Magic link sent! Please check your Gmail inbox.');
      } else {
        const res = await api.post('/auth/login', { 
            email: email.toLowerCase().trim(), 
            password 
        });
        const { access_token, refresh_token, user: userData } = res.data;
        login(access_token, refresh_token, userData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
      setError('');
      setIsLoading(true);
      try {
          const res = await api.post('/auth/guest-login');
          const { access_token, refresh_token, user: userData } = res.data;
          login(access_token, refresh_token, userData);
      } catch (err) {
          setError('Guest access is currently restricted.');
      } finally {
          setIsLoading(false);
      }
  };

  const handleGoogleLogin = () => {
      // Placeholder for Google Login
      setError('Google Login is currently unavailable. Please use Password or Magic Link.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Checkered Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] shadow-lg hover:scale-110 transition-transform cursor-pointer"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md px-6 z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl premium-gradient flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20 ring-4 ring-[var(--background)] group">
             <Fingerprint className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-[var(--muted)] text-sm font-medium">
            Sign in to continue to TaskPro
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-card p-8 shadow-2xl relative overflow-hidden">
          
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--card-hover)] rounded-xl mb-8 border border-[var(--border)]">
              <button
                onClick={() => { setMethod('password'); setError(''); setInfo(''); }}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    method === 'password' 
                    ? 'bg-[var(--background)] text-[var(--primary)] shadow-sm' 
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                  <Shield className="w-4 h-4" />
                  Password
              </button>
              <button
                onClick={() => { setMethod('magic'); setError(''); setInfo(''); }}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    method === 'magic' 
                    ? 'bg-[var(--background)] text-[var(--primary)] shadow-sm' 
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                  <Wand2 className="w-4 h-4" />
                  Magic Link
              </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 mb-6 rounded-xl text-xs font-bold border bg-red-500/10 text-red-500 border-red-500/20 animate-in slide-in-from-top-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
            </div>
          )}
          {info && (
            <div className="p-4 mb-6 rounded-xl text-xs font-bold border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-in slide-in-from-top-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {info}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] w-5 h-5 group-focus-within/input:text-[var(--primary)] transition-colors" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)] transition-all font-medium placeholder:text-[var(--muted)]/50"
                  required={!isLoading}
                />
              </div>
            </div>
            
            {method === 'password' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider ml-1">Password</label>
                    <div className="relative group/input">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] w-5 h-5 group-focus-within/input:text-[var(--primary)] transition-colors" />
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)] transition-all font-medium placeholder:text-[var(--muted)]/50"
                            required={!isLoading}
                        />
                    </div>
                </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full premium-gradient text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 mt-2"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  method === 'magic' ? 'Send Magic Link' : 'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border)]"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--card)] px-2 text-[var(--muted)] font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          {/* Alternative Logins */}
          <div className="grid grid-cols-2 gap-3">
             <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--card-hover)] text-[var(--foreground)] py-3 rounded-xl transition-all font-semibold text-sm group"
             >
                <Chrome className="w-5 h-5 text-[var(--muted)] group-hover:text-blue-500 transition-colors" />
                <span>Google</span>
             </button>
             <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--card-hover)] text-[var(--foreground)] py-3 rounded-xl transition-all font-semibold text-sm group"
             >
                <User className="w-5 h-5 text-[var(--muted)] group-hover:text-emerald-500 transition-colors" />
                <span>Guest</span>
             </button>
          </div>

        </div>
        
        {/* Footer */}
        <p className="text-center text-[var(--muted)] text-xs mt-8">
            TaskPro Secure System &copy; {new Date().getFullYear()}
        </p>

      </div>
    </div>
  );
}
