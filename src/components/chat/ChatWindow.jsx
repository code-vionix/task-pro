
import { useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import ChatWindowHeader from './ChatWindowHeader';
import MessageStream from './MessageStream';

/**
 * ChatWindow orchestrates the active conversation display and input.
 */
export default function ChatWindow({ 
  selectedUser, 
  messages, 
  currentUser, 
  isGuest, 
  onBack, 
  onSend, 
  input, 
  setInput, 
  onReact, 
  onDelete, 
  formatLastSeen 
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[var(--background)]/20 animate-in fade-in duration-700">
      
      {/* 1. Dynamic User Header */}
      <ChatWindowHeader 
        selectedUser={selectedUser}
        onBack={onBack}
        isGuest={isGuest}
        formatLastSeen={formatLastSeen}
      />

      {/* 2. Message Transmission Stream */}
      <MessageStream 
        messages={messages}
        currentUser={currentUser}
        isGuest={isGuest}
        onReact={onReact}
        onDelete={onDelete}
        messagesEndRef={messagesEndRef}
      />

      {/* 3. Operational Input Console */}
      <ChatInput 
        input={input}
        setInput={setInput}
        onSend={onSend}
        isGuest={isGuest}
      />
    </div>
  );
}
