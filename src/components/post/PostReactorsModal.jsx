
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useState } from 'react';

export default function PostReactorsModal({ reactions, onClose }) {
  const [activeTab, setActiveTab] = useState('ALL');

  const getReactorsByType = (type) => {
    if (type === 'ALL') return reactions;
    return reactions.filter(r => r.type === type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card)]">
          <h3 className="font-black uppercase tracking-widest text-[var(--foreground)] text-xs italic">Reactions</h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--border)] rounded-full text-[var(--muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-[var(--border)] bg-[var(--card)]/50">
          {['ALL', 'LIKE', 'LOVE', 'DISLIKE'].map(type => (
            <button 
              key={type}
              onClick={() => setActiveTab(type)}
              className={clsx(
                "flex-1 py-3 text-[9px] font-black uppercase tracking-tighter transition-all",
                activeTab === type ? "text-blue-500 border-b-2 border-blue-500 bg-blue-500/5 shadows-inner" : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {type === 'ALL' ? 'Total' : type === 'LIKE' ? '👍' : type === 'LOVE' ? '❤️' : '👎'}
              {` (${getReactorsByType(type).length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-black/5">
          {getReactorsByType(activeTab).map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 hover:bg-[var(--card-hover)] rounded-xl transition-all border border-transparent hover:border-[var(--border)] group/item">
              <div className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] overflow-hidden shrink-0 shadow-sm group-hover/item:border-blue-500/50 transition-colors">
                {r.user.avatarUrl ? <img src={r.user.avatarUrl} className="w-full h-full object-cover" /> : r.user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] font-black text-[var(--foreground)] truncate uppercase tracking-tight italic">{r.user.email.split('@')[0]}</p>
              </div>
              <span className="text-sm">
                {r.type === 'LIKE' ? '👍' : r.type === 'LOVE' ? '❤️' : '👎'}
              </span>
            </div>
          ))}
          {getReactorsByType(activeTab).length === 0 && (
            <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">No reactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
