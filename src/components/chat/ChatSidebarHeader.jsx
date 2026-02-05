
import { Search } from 'lucide-react';

/**
 * ChatSidebarHeader displays the sidebar title and search input.
 */
export default function ChatSidebarHeader({ onSearch }) {
  return (
    <div className="p-6 border-b border-[var(--border)]">
      <h2 className="text-xl font-black text-[var(--foreground)] italic tracking-tight mb-4 uppercase text-blue-500">
        Messages
      </h2>
      <div className="relative group">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Filter channels..." 
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full bg-[var(--card)]/50 border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all shadow-inner"
        />
      </div>
    </div>
  );
}
