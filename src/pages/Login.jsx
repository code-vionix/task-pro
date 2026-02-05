
import { Mail, Shield, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMagicLink, setIsMagicLink] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      if (isMagicLink) {
          await api.post('/auth/request-magic-link', { email: email.toLowerCase().trim() });
          setInfo('Magic link sent! Please check your Gmail inbox.');
      } else {
        const res = await api.post('/auth/login', { 
            email: email.toLowerCase().trim(), 
            password 
        });
        const { access_token, refresh_token, user } = res.data;
        login(access_token, refresh_token, user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md px-6 z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl premium-gradient flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20 ring-4 ring-[var(--foreground)]/5">
             <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight uppercase italic leading-none">
            Task<span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-[var(--muted)] text-xs font-bold tracking-[0.3em] uppercase mt-2">Enterprise Solutions</p>
        </div>

        <div className="glass p-8 rounded-[2rem] shadow-2xl border border-[var(--border)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 premium-gradient opacity-50"></div>
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {isMagicLink ? 'Universal Access' : 'Secure Terminal'}
            </h2>
            <p className="text-[var(--muted)] text-sm">
              {isMagicLink ? 'Login with your Gmail and a secure link.' : 'Authenticate using your established credentials.'}
            </p>
          </div>
          
          {error && <div className="p-4 mb-6 rounded-xl text-sm font-medium border bg-rose-500/10 text-rose-500 border-rose-500/20">{error}</div>}
          {info && <div className="p-4 mb-6 rounded-xl text-sm font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{info}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest ml-1">Gmail Account</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] w-5 h-5 group-focus-within/input:text-blue-500 transition-colors" />
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--foreground)] transition-all font-medium"
                  required
                />
              </div>
            </div>
            
            {!isMagicLink && (
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest ml-1">Security Keyphrase</label>
                    <div className="relative group/input">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] w-5 h-5 group-focus-within/input:text-blue-500 transition-colors" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--foreground)] transition-all font-medium"
                            required
                        />
                    </div>
                </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full premium-gradient text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (isMagicLink ? 'Send Magic Link' : 'Log In')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <button
              onClick={() => {
                  setIsMagicLink(!isMagicLink);
                  setError('');
                  setInfo('');
              }}
              className="text-blue-500 hover:text-blue-400 text-xs font-bold tracking-wide transition-colors uppercase flex items-center justify-center gap-2 mx-auto"
            >
              <Wand2 className="w-4 h-4" />
              {isMagicLink ? 'Login with Password' : 'Login with Magic Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
