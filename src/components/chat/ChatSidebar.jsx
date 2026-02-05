
import clsx from 'clsx';
import ChatSidebarHeader from './ChatSidebarHeader';
import ConversationListItem from './ConversationListItem';

/**
 * ChatSidebar orchestrates the conversation list and searching functionality.
 */
export default function ChatSidebar({ chats, selectedUser, onSelectChat, isGuest, showSidebar }) {
  return (
    <div className={clsx(
      "w-full md:w-96 border-r border-[var(--border)] flex flex-col bg-[var(--card)]/10 backdrop-blur-xl transition-all duration-500",
      !showSidebar && "hidden md:flex",
      showSidebar && "flex animate-in slide-in-from-left duration-500"
    )}>
      {/* 1. Header with Search */}
      <ChatSidebarHeader 
          onSearch={(val) => {
              // Internal filter logic or lift to parent if needed
              console.log('Filtering chats for:', val);
          }}
      />

      {/* 2. Conversations Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chats.length === 0 ? (
          <div className="p-10 text-center opacity-30 flex flex-col items-center justify-center h-full">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">No Neural Channels Active</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]/50">
            {chats.map(chat => (
              <ConversationListItem 
                key={chat.id}
                chat={chat}
                isSelected={selectedUser?.id === chat.id}
                onSelect={onSelectChat}
                isGuest={isGuest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
