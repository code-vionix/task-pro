
import { ShieldAlert } from 'lucide-react';

/**
 * RestrictedAccess overlay for users who are blocked or in guest mode.
 */
export default function RestrictedAccess({ isTotallyBlocked, isGuest, onRegister }) {
  return (
    <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="bg-[var(--card)] border border-[var(--border)] p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-in zoom-in duration-700 max-w-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 premium-gradient opacity-50"></div>
        
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mx-auto mb-8 border border-amber-500/20 group-hover:rotate-12 transition-transform">
          <ShieldAlert className="w-10 h-10 text-amber-500" />
        </div>
        
        <h3 className="text-2xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tighter italic">
          {isTotallyBlocked ? "Access Revoked" : "Observer Protocol"}
        </h3>
        
        <p className="text-sm text-[var(--muted)] font-black uppercase tracking-widest leading-relaxed opacity-70 mb-8 px-4">
          {isTotallyBlocked 
            ? "Your authentication clearance has been suspended. Communications terminal is offline."
            : "Verification required to transmit data. You are currently in read-only observation mode."
          }
        </p>

        {isGuest && (
          <button 
            onClick={onRegister}
            className="w-full premium-gradient text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
          >
            Register Full Identity
          </button>
        )}
      </div>
    </div>
  );
}
