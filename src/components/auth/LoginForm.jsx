
import { Loader2, Mail, Shield, Wand2 } from 'lucide-react';

/**
 * LoginForm handles the input and submission for Password and Magic Link methods.
 */
export default function LoginForm({ 
  method, 
  setMethod, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  onSubmit, 
  onForgotPassword, 
  isLoading 
}) {
  return (
    <div className="space-y-8">
      {/* 1. Method Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[var(--background)]/50 rounded-2xl border border-[var(--border)] shadow-inner">
        <button
          onClick={() => setMethod('password')}
          className={`flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
            method === 'password' 
            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security Key
        </button>
        <button
          onClick={() => setMethod('magic')}
          className={`flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
            method === 'magic' 
            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Magic Port
        </button>
      </div>

      {/* 2. Authentication Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.3em] ml-1">Universal Endpoint</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] w-5 h-5 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <input
              type="email"
              placeholder="verified@grid.net"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--background)]/60 border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-[var(--foreground)] transition-all font-bold placeholder:opacity-30 placeholder:italic shadow-inner"
              required={!isLoading}
            />
          </div>
        </div>
        
        {method === 'password' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.3em]">Access Code</label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
              >
                Reset Verification?
              </button>
            </div>
            <div className="relative group">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] w-5 h-5 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              <input
                type="password"
                placeholder="Access credentials..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--background)]/60 border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-[var(--foreground)] transition-all font-bold placeholder:opacity-30 placeholder:italic shadow-inner"
                required={!isLoading}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full premium-gradient text-white font-black uppercase tracking-[0.4em] text-[11px] py-5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 mt-4 h-14"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            method === 'magic' ? 'Transmit Magic Link' : 'Secure Entry'
          )}
        </button>
      </form>
    </div>
  );
}
