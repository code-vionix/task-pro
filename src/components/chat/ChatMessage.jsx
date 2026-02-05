
import clsx from 'clsx';
import { Check, CheckCheck, Trash2 } from 'lucide-react';

/**
 * ChatMessage displays a single message bubble with optional reactions and actions.
 */
export default function ChatMessage({ msg, isMine, isLastInGroup, onReact, onDelete, currentUser, isGuest }) {
  return (
    <div className={clsx("flex w-full gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300", isMine ? "flex-row-reverse" : "flex-row")}>
      <div className="w-8 h-8 shrink-0 flex items-end">
        {isLastInGroup ? (
          <div className="w-8 h-8 rounded-full bg-[var(--card)] overflow-hidden border border-[var(--border)] shadow-sm">
            {msg.sender.avatarUrl ? (
              <img 
                src={msg.sender.avatarUrl} 
                className="w-full h-full object-cover" 
                style={{ objectPosition: msg.sender.avatarPosition ? `${msg.sender.avatarPosition.x}% ${msg.sender.avatarPosition.y}%` : 'center' }}
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--foreground)] uppercase">
                {(msg.sender.email || '?')[0]}
              </span>
            )}
          </div>
        ) : <div className="w-8" />}
      </div>

      <div className={clsx("flex flex-col max-w-[75%] group", isMine ? "items-end" : "items-start")}>
        <div className="relative group/bubble">
          <div className={clsx(
            "px-4 py-2.5 rounded-[20px] text-sm leading-relaxed shadow-sm transition-all group-hover/bubble:shadow-md",
            isMine 
              ? "bg-blue-600 text-white rounded-br-none" 
              : "bg-[var(--card)] text-[var(--foreground)] rounded-bl-none border border-[var(--border)]"
          )}>
            {msg.content}
          </div>

          {/* Reactions */}
          {msg.reactions?.length > 0 && (
            <div className={clsx(
              "absolute -bottom-3 flex items-center bg-[var(--card)] border border-[var(--border)] rounded-full px-1.5 py-0.5 shadow-lg z-10 scale-90",
              isMine ? "right-0" : "left-0"
            )}>
              {msg.reactions.map((r, i) => (
                <span key={i} className="text-xs">
                  {r.type === 'LIKE' ? '👍' : r.type === 'LOVE' ? '❤️' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Inline Action Button (Like/Unlike) */}
          <button 
            onClick={() => onReact(msg.id, msg.reactions?.some((r) => r.userId === currentUser?.id && r.type === 'LIKE') ? 'UNLIKE' : 'LIKE')}
            disabled={isGuest}
            className={clsx(
              "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-[var(--card-hover)] z-10",
              isMine ? "-left-12" : "-right-12",
              isGuest && "cursor-not-allowed"
            )}
          >
            <div className={clsx(
              "text-lg transition-transform active:scale-125",
              msg.reactions?.some((r) => r.userId === currentUser?.id) ? "scale-110" : "opacity-50 hover:opacity-100"
            )}>
              {msg.reactions?.some((r) => r.userId === currentUser?.id && r.type === 'LIKE') ? '👍' : '👍'}
            </div>
          </button>
        </div>
        
        {/* Metadata & Unsend Action */}
        <div className="mt-1.5 flex items-center gap-2 px-1 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMine && (
            msg.isRead 
              ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> 
              : <Check className="w-3.5 h-3.5 text-slate-500" />
          )}
          {isMine && !isGuest && (
            <button 
              onClick={() => onDelete(msg.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-rose-500 hover:text-rose-400 p-1"
              title="Unsend"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
