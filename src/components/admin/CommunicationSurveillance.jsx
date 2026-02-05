
import clsx from 'clsx';
import { MessageSquare, Shield, XCircle } from 'lucide-react';

/**
 * CommunicationSurveillance component allows admins to monitor and manage user conversations.
 */
export default function CommunicationSurveillance({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  adminMessages, 
  onDeleteMessage 
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 1. Channel List */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.3em] px-2 italic">Active Neural Channels</h3>
        <div className="glass-card divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto custom-scrollbar shadow-xl border-[var(--border)]">
          {conversations.length === 0 ? (
            <div className="p-10 text-center text-[var(--muted)] italic text-sm">No recorded signals found.</div>
          ) : (
            conversations.map((conv, idx) => (
              <button 
                key={idx}
                onClick={() => onSelectConversation(conv.user1.id, conv.user2.id)}
                className={clsx(
                  "w-full p-5 flex flex-col gap-3 hover:bg-[var(--foreground)]/[0.03] transition-all text-left group",
                  selectedConversation?.u1 === conv.user1.id && selectedConversation?.u2 === conv.user2.id && "bg-blue-500/5 border-l-4 border-blue-500"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-black text-[11px] truncate text-[var(--foreground)] uppercase tracking-tight italic">{conv.user1.email.split('@')[0]}</span>
                    <Shield className="w-3 h-3 text-blue-500/50" />
                    <span className="font-black text-[11px] truncate text-[var(--foreground)] uppercase tracking-tight italic">{conv.user2.email.split('@')[0]}</span>
                  </div>
                  <span className="text-[9px] font-black text-[var(--muted)] uppercase opacity-50 shrink-0">
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="h-[1px] w-0 group-hover:w-full bg-blue-500/20 transition-all duration-500"></div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 2. Decryption Console (Messages) */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.3em] px-2 italic">Transmission Log Content</h3>
        <div className="glass-card min-h-[600px] flex flex-col shadow-2xl border-[var(--border)] bg-black/5">
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30 animate-pulse">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[var(--muted)] flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Select a channel to decrypt operational data</p>
            </div>
          ) : (
            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
              {adminMessages.map((m, idx) => {
                const isUser1 = m.senderId === selectedConversation.u1;
                const prevMsg = idx > 0 ? adminMessages[idx - 1] : null;
                const showAvatar = !prevMsg || prevMsg.senderId !== m.senderId;
                
                return (
                  <div key={m.id} className={clsx("flex gap-4 animate-in fade-in duration-300", isUser1 ? "flex-row" : "flex-row-reverse")}>
                    <div className="w-10 h-10 shrink-0 flex items-end">
                      {showAvatar && (
                        <div className={clsx(
                          "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black border border-[var(--border)] shadow-sm",
                          isUser1 
                            ? "bg-blue-600/10 text-blue-500" 
                            : "bg-purple-600/10 text-purple-500"
                        )}>
                          {m.sender.email[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className={clsx("flex flex-col gap-2 max-w-[75%]", isUser1 ? "items-start" : "items-end")}>
                      {showAvatar && (
                        <div className="flex items-center gap-2 px-1">
                          <span className={clsx(
                            "text-[10px] font-black uppercase tracking-widest",
                            isUser1 ? "text-blue-500" : "text-purple-500"
                          )}>
                            {m.sender.email.split('@')[0]}
                          </span>
                          <span className="text-[8px] font-black text-[var(--muted)] opacity-50">
                            {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      )}
                      
                      <div className={clsx(
                        "p-4 rounded-[20px] text-sm font-medium relative group shadow-sm transition-all hover:shadow-md",
                        isUser1 
                          ? "bg-[var(--card)] border border-blue-500/20 text-[var(--foreground)] rounded-tl-sm" 
                          : "bg-[var(--card)] border border-purple-500/20 text-[var(--foreground)] rounded-tr-sm"
                      )}>
                        {m.content}
                        <button 
                          onClick={() => onDeleteMessage(m.id)}
                          className="absolute -right-3 -top-3 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100 z-10"
                          title="Erase Signal"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
