
import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';

/**
 * ChatWindowHeader displays the active chat partner's info and status.
 */
export default function ChatWindowHeader({ selectedUser, onBack, isGuest, formatLastSeen }) {
  return (
    <div className="h-20 px-4 md:px-8 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/40 backdrop-blur-md relative z-10">
      {isGuest && (
        <div className="absolute inset-0 bg-amber-500/5 backdrop-blur-[1px] z-[1] flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 opacity-20">Monitoring Active</span>
        </div>
      )}
      
      <div className="flex items-center gap-3 md:gap-4 z-[2]">
        <button 
          onClick={onBack}
          className="md:hidden p-2 -ml-2 text-[var(--muted)] hover:text-blue-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] font-bold border border-[var(--border)] overflow-hidden shrink-0 shadow-inner">
            {selectedUser.avatarUrl ? (
              <img 
                src={selectedUser.avatarUrl} 
                className="w-full h-full object-cover" 
                style={{ objectPosition: selectedUser.avatarPosition ? `${selectedUser.avatarPosition.x}% ${selectedUser.avatarPosition.y}%` : 'center' }}
                alt={selectedUser.email}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500/20 text-blue-500 font-black">
                {selectedUser.email[0].toUpperCase()}
              </div>
            )}
          </div>
          {selectedUser.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[var(--background)] rounded-full animate-pulse shadow-lg shadow-emerald-500/20"></div>
          )}
        </div>

        <div>
          <h3 className="font-black text-[var(--foreground)] uppercase tracking-tighter italic text-base leading-tight">
            {selectedUser.email.split('@')[0]}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={clsx(
              "w-2 h-2 rounded-full", 
              selectedUser.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-600"
            )}></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {selectedUser.isOnline ? "Online Now" : `Last seen ${formatLastSeen(selectedUser.lastSeen)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
