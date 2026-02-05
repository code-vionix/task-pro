
import { Chrome, User } from 'lucide-react';

/**
 * LoginMethods handles alternative authentication providers like Google and Guest access.
 */
export default function LoginMethods({ onGoogleLogin, onGuestLogin, isLoading }) {
  return (
    <div className="space-y-8 mt-10">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--border)] opacity-50"></span>
        </div>
        <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.5em]">
          <span className="bg-[var(--card)] px-4 text-[var(--muted)]">Neural Connect</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 bg-[var(--background)]/40 border border-[var(--border)] hover:border-blue-500/50 text-[var(--foreground)] py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest group shadow-sm hover:shadow-lg active:scale-95"
        >
          <Chrome className="w-5 h-5 text-[var(--muted)] group-hover:text-blue-500 transition-colors" />
          <span>Google</span>
        </button>
        <button
          type="button"
          onClick={onGuestLogin}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 bg-[var(--background)]/40 border border-[var(--border)] hover:border-emerald-500/50 text-[var(--foreground)] py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest group shadow-sm hover:shadow-lg active:scale-95"
        >
          <User className="w-5 h-5 text-[var(--muted)] group-hover:text-emerald-500 transition-colors" />
          <span>Observer</span>
        </button>
      </div>
    </div>
  );
}
