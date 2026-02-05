
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthStatus from '../components/auth/AuthStatus';
import LoginForm from '../components/auth/LoginForm';
import LoginHeader from '../components/auth/LoginHeader';
import LoginMethods from '../components/auth/LoginMethods';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

/**
 * Login Page
 * Entry point for the application. Optimized for security and visual impact.
 * Refactored into specialized sub-components for better maintainability.
 */
export default function Login() {
  const [method, setMethod] = useState('password'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Error timer logic for rate limiting feedback
  useEffect(() => {
    if (error && error.includes('Try again in')) {
      const match = error.match(/in (\d+) seconds/);
      if (match) {
        const seconds = parseInt(match[1], 10);
        if (seconds > 0) {
          const timer = setTimeout(() => {
            setError(prev => prev.replace(/in \d+ seconds/, `in ${seconds - 1} seconds`));
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
          setInfo('Access portal link transmitted. Check your secure inbox.');
      } else {
        const res = await api.post('/auth/login', { 
            email: email.toLowerCase().trim(), 
            password 
        });
        const { access_token, refresh_token, user: userData } = res.data;
        login(access_token, refresh_token, userData);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication sequence failed.';
      
      // Handle existing password constraint for magic links
      if (method === 'magic' && msg.includes('already set a password')) {
          setMethod('password');
          setError(''); 
          setInfo('Security Protocol: This account is locked with a password. Please enter your credentials below.');
      } else {
          setError(msg);
      }
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
          setError('Guest observation portal is currently offline.');
      } finally {
          setIsLoading(false);
      }
  };

  const handleForgotPassword = async () => {
    if (!email) {
        setError('Endpoint required for verification key reset.');
        return;
    }
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
        await api.post('/auth/request-magic-link', { 
            email: email.toLowerCase().trim(),
            forgotPassword: true 
        });
        setInfo('Verification override link dispatched to your endpoint.');
    } catch (err) {
        setError(err.response?.data?.message || 'Override sequence aborted.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden transition-colors duration-700">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[160px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.05] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      {/* Theme Control */}
      <button 
        onClick={toggleTheme}
        className="absolute top-8 right-8 z-50 p-4 rounded-2xl bg-[var(--card)]/50 border border-[var(--border)] text-[var(--foreground)] shadow-2xl hover:scale-110 active:scale-90 transition-all backdrop-blur-md"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-lg px-8 z-10">
        
        {/* Logo & Heading */}
        <LoginHeader />

        {/* Auth Module */}
        <div className="glass-card p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border-[var(--border)] relative overflow-hidden bg-[var(--card)]/40 backdrop-blur-2xl rounded-[2.5rem]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16"></div>
          
          <AuthStatus error={error} info={info} />

          <LoginForm 
            method={method}
            setMethod={setMethod}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onSubmit={handleSubmit}
            onForgotPassword={handleForgotPassword}
            isLoading={isLoading}
          />

          <LoginMethods 
            onGoogleLogin={() => setError('Google OAuth module is currently de-energized.')}
            onGuestLogin={handleGuestLogin}
            isLoading={isLoading}
          />
        </div>
        
        {/* System Metadata */}
        <footer className="mt-12 text-center">
            <p className="text-[var(--muted)] text-[9px] font-black uppercase tracking-[0.5em] opacity-40">
                TaskPro Secure Infrastructure &bull; {new Date().getFullYear()}
            </p>
        </footer>
      </div>
    </div>
  );
}
