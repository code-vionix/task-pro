
import clsx from 'clsx';
import { Bell, BellOff, Loader2, Lock } from 'lucide-react';
import FormInput from './FormInput';

/**
 * SecurityAndAudioSettings combines password management and notification sound toggles.
 */
export default function SecurityAndAudioSettings({ 
  passwords, 
  setPasswords, 
  onPasswordSubmit, 
  isSaving,
  isMuted,
  onToggleMute 
}) {
  return (
    <div className="space-y-8">
      {/* 1. Security Console */}
      <section className="glass-card p-10 shadow-2xl border-[var(--border)]">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tighter italic">Security protocol</h2>
            <p className="text-[var(--muted)] text-xs font-black uppercase tracking-[0.2em] opacity-60">Update Verification Key</p>
          </div>
        </div>

        <form onSubmit={onPasswordSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormInput 
              label="New Access Key" 
              type="password" 
              value={passwords.newPassword} 
              onChange={(v) => setPasswords({...passwords, newPassword: v})} 
              placeholder="••••••••" 
            />
            <FormInput 
              label="Confirm Access Key" 
              type="password" 
              value={passwords.confirmPassword} 
              onChange={(v) => setPasswords({...passwords, confirmPassword: v})} 
              placeholder="••••••••" 
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 font-black py-5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-rose-500/5"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            Overwrite Keys
          </button>
        </form>
      </section>

      {/* 2. Audio Feed Controls */}
      <section className="glass-card p-10 shadow-2xl border-[var(--border)] bg-[var(--card)]/10">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tighter italic">Operational Audio</h2>
            <p className="text-[var(--muted)] text-xs font-black uppercase tracking-[0.2em] opacity-60">Neural Alerts & Signals</p>
          </div>
        </div>
        
        <div className="bg-[var(--background)]/40 border border-[var(--border)] rounded-2xl p-6 flex items-center justify-between transition-all hover:border-[var(--muted)]/30 group">
          <div className="flex items-center gap-5">
            <div className={clsx(
              "p-3 rounded-xl transition-all duration-500", 
              isMuted ? "bg-slate-500/10 text-slate-500" : "bg-blue-600/10 text-blue-500 scale-110 shadow-lg shadow-blue-500/10"
            )}>
              {isMuted ? <BellOff className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="text-base font-black text-[var(--foreground)] uppercase tracking-tight">Audio Transmissions</h4>
              <p className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest mt-1 opacity-60">Play sonic alerts for new signals</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onToggleMute}
            className={clsx(
                "relative w-16 h-8 rounded-full transition-all duration-500 focus:outline-none p-1",
                isMuted ? "bg-slate-700" : "bg-blue-600 shadow-lg shadow-blue-500/30"
            )}
          >
            <div className={clsx(
                "w-6 h-6 bg-white rounded-full transition-all duration-500 shadow-md transform",
                !isMuted ? "translate-x-8 rotate-180" : "translate-x-0"
            )} />
          </button>
        </div>
      </section>
    </div>
  );
}
