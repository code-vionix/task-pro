
import { MessageCircle, ShieldAlert } from 'lucide-react';

/**
 * ChatWelcome displays the empty state when no conversation is selected.
 */
export default function ChatWelcome({ isGuest }) {
  return (
    <section className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[var(--background)]/10 animate-in fade-in zoom-in duration-700">
      <div className="w-28 h-28 rounded-[2.5rem] bg-[var(--card)] flex items-center justify-center mb-8 border border-[var(--border)] shadow-2xl relative group hover:rotate-6 transition-all duration-500">
        <MessageCircle className="w-14 h-14 text-[var(--muted)] group-hover:text-blue-500 transition-all duration-700" />
        {isGuest && (
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
        )}
      </div>
      
      <h3 className="text-3xl font-black text-[var(--foreground)] italic tracking-tighter mb-3 uppercase">
        Secure <span className="text-blue-500">Channels</span>
      </h3>
      <p className="text-[var(--muted)] max-w-xs text-xs font-black uppercase tracking-[0.2em] opacity-60">
        Initiate a peer-to-peer connection to synchronize communications.
      </p>

      {isGuest && (
        <div className="mt-10 px-6 py-3 border border-amber-500/20 bg-amber-500/5 rounded-2xl text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4 animate-pulse shadow-lg shadow-amber-500/5">
          <ShieldAlert className="w-5 h-5" />
          Neural Simulation Active
        </div>
      )}
    </section>
  );
}
