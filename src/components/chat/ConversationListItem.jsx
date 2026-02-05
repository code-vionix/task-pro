
import clsx from 'clsx';

/**
 * ConversationListItem represents a single chat entry in the sidebar.
 */
export default function ConversationListItem({ chat, isSelected, onSelect, isGuest }) {
  return (
    <button 
      onClick={() => onSelect(chat)}
      className={clsx(
        "w-full p-4 flex items-center gap-3 text-left hover:bg-[var(--card-hover)] transition-all group relative",
        isSelected && "bg-blue-500/10 border-l-2 border-blue-500"
      )}
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-[var(--card)] overflow-hidden flex items-center justify-center border border-[var(--border)] shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
          {chat.avatarUrl ? (
            <img 
              src={chat.avatarUrl} 
              className="w-full h-full object-cover" 
              style={{ objectPosition: chat.avatarPosition ? `${chat.avatarPosition.x}% ${chat.avatarPosition.y}%` : 'center' }}
              alt={chat.email}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white font-black text-sm">
              {chat.email[0].toUpperCase()}
            </div>
          )}
        </div>
        
        {chat.unreadCount > 0 && !isGuest && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--background)] animate-in zoom-in">
            {chat.unreadCount}
          </div>
        )}
        
        {chat.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[var(--background)] rounded-full shadow-lg shadow-emerald-500/20"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h4 className={clsx(
            "font-bold text-sm truncate uppercase tracking-tight italic", 
            chat.unreadCount > 0 && !isGuest ? "text-[var(--foreground)]" : "text-[var(--muted)]"
          )}>
            {chat.email.split('@')[0]}
          </h4>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest shrink-0">
            {new Date(chat.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className={clsx(
          "text-xs truncate mt-1 italic pr-2 font-medium opacity-80", 
          chat.unreadCount > 0 && !isGuest ? "text-blue-400 font-bold opacity-100" : "text-[var(--muted)]"
        )}>
          {chat.lastMessage}
        </p>
      </div>
    </button>
  );
}
