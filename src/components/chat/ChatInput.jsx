
import { Send } from 'lucide-react';

/**
 * ChatInput provides the text entry and transmission interface.
 */
export default function ChatInput({ input, setInput, onSend, isGuest }) {
  return (
    <form 
      onSubmit={onSend} 
      className="p-4 bg-[var(--background)]/60 border-t border-[var(--border)] flex gap-3 items-center relative z-10 backdrop-blur-md"
    >
      <div className="flex-1 relative group">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isGuest ? "Signals restricted in Guest Mode" : "Compose signal..."}
          disabled={isGuest}
          className="w-full bg-[var(--card)]/50 border border-[var(--border)] rounded-full px-6 py-4 text-sm text-[var(--foreground)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all disabled:opacity-50 placeholder:italic font-medium pr-16 shadow-inner"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isGuest}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-500/20 active:scale-90 transition-all disabled:opacity-50 z-10 group-focus-within:scale-105"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
