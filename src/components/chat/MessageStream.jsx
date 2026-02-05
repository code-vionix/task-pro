
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage';

/**
 * MessageStream handles the scrollable display of messages.
 */
export default function MessageStream({ 
  messages, 
  currentUser, 
  isGuest, 
  onReact, 
  onDelete, 
  messagesEndRef 
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/5 relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_var(--foreground)_1px,_transparent_1px)] bg-[size:24px_24px]" />
      
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center opacity-30 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 border-2 border-dashed border-[var(--muted)] rounded-3xl flex items-center justify-center mb-6 transform rotate-12">
            <Send className="w-10 h-10 text-[var(--muted)]" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] italic">Start Transmission</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <ChatMessage 
            key={msg.id || idx}
            msg={msg}
            isMine={msg.senderId === currentUser?.id}
            isLastInGroup={idx === messages.length - 1 || messages[idx + 1].senderId !== msg.senderId}
            onReact={onReact}
            onDelete={onDelete}
            currentUser={currentUser}
            isGuest={isGuest}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
