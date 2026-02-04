
import clsx from 'clsx';
import { ArrowLeft, Check, CheckCheck, MessageSquare, Search, Send, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Chat() {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');

  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.id) return;

    // Connect to Socket.io
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { userId: currentUser.id },
    });
    setSocket(newSocket);

    newSocket.on('newMessage', (msg) => {
        setMessages(prev => {
            if (msg.senderId === selectedUser?.id || msg.receiverId === selectedUser?.id) {
                if (msg.senderId === selectedUser?.id) {
                    newSocket.emit('markAsRead', { senderId: msg.senderId, userId: currentUser.id });
                }
                return [...prev, msg];
            }
            return prev;
        });
        fetchChats();
    });

    newSocket.on('messageReaction', ({ messageId, reaction }) => {
        setMessages(prev => prev.map(m => 
            m.id === messageId 
                // Add new reaction (simplified logic: just append)
                ? { ...m, reactions: [...(m.reactions?.filter((r) => r.userId !== reaction.userId) || []), reaction] } 
                : m
        ));
    });

    newSocket.on('messagesRead', ({ readerId }) => {
        if (selectedUser?.id === readerId) {
            setMessages(prev => prev.map(m => m.receiverId === readerId ? { ...m, isRead: true } : m));
        }
        setChats(prev => prev.map(chat => chat.id === readerId ? { ...chat, lastMessageIsRead: true } : chat));
    });

    newSocket.on('userStatusChanged', ({ userId, isOnline }) => {
        setChats(prev => prev.map(chat => 
            chat.id === userId ? { ...chat, isOnline, lastSeen: new Date() } : chat
        ));
        if (selectedUser?.id === userId) {
            setSelectedUser((prev) => prev ? { ...prev, isOnline, lastSeen: new Date() } : prev);
        }
    });

    newSocket.on('messageDeleted', ({ messageId }) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        fetchChats();
    });

    return () => {
        newSocket.disconnect();
    };
  }, [currentUser?.id, selectedUser?.id]);

  const formatLastSeen = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diff < 60) return 'seconds ago';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString();
  };

  useEffect(() => {
    fetchChats();
    if (targetUserId) {
        fetchUserInfo(targetUserId);
        fetchConversation(targetUserId);
    }
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await api.get('/messages/chats');
      setChats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserInfo = async (id) => {
      try {
          const res = await api.get(`/users/${id}`);
          setSelectedUser(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  const fetchConversation = async (id) => {
    try {
      const res = await api.get(`/messages/conversation/${id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser || !socket) return;

    const messageData = {
      senderId: currentUser?.id,
      receiverId: selectedUser.id,
      content: input,
    };

    socket.emit('sendMessage', messageData, (response) => {
        setMessages(prev => [...prev, response]);
        fetchChats();
    });

    setInput('');
  };

  const selectChat = (user) => {
      setSelectedUser(user);
      fetchConversation(user.id);
      // Mark as read locally and on server
      setChats(prev => prev.map(c => c.id === user.id ? { ...c, unreadCount: 0 } : c));
      socket?.emit('markAsRead', { senderId: user.id, userId: currentUser?.id });
      api.patch(`/messages/read/${user.id}`);
      // Hide sidebar on mobile when a chat is selected
      if (window.innerWidth < 768) {
          setShowSidebar(false);
      }
  };

  const handleReact = (messageId, type) => {
      if (!socket || !selectedUser) return;
      socket.emit('reactToMessage', { 
          messageId, 
          type, 
          userId: currentUser?.id, 
          receiverId: selectedUser.id 
      });
      // Update locally
      setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, reactions: [...(m.reactions?.filter((r) => r.userId !== currentUser?.id) || []), { userId: currentUser?.id, type }] } 
            : m
      ));
  };

  const handleDeleteMessage = (messageId) => {
      if (!socket || !selectedUser) return;
      if (confirm('Unsend this message?')) {
          socket.emit('deleteMessage', { messageId, userId: currentUser?.id, receiverId: selectedUser.id });
          // Update locally
          setMessages(prev => prev.filter(m => m.id !== messageId));
          fetchChats();
      }
  };

  return (
    <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-160px)] flex border border-[var(--border)] glass rounded-xl md:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-500">
      {/* Sidebar: Recent Chats */}
      <div className={clsx(
          "w-full md:w-80 border-r border-[var(--border)] flex flex-col bg-[var(--background)]/30 transition-all duration-300",
          !showSidebar && "hidden md:flex",
          showSidebar && "flex"

      )}>
        <div className="p-6 border-b border-[var(--border)]">
            <h2 className="text-xl font-black text-[var(--foreground)] italic tracking-tight mb-4 uppercase">Direct Messages</h2>
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search people..." 
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {chats.length === 0 ? (
                <div className="p-10 text-center text-slate-500 italic text-xs">No active conversations</div>
            ) : (
                <div className="divide-y divide-[var(--border)]">
                    {chats.map(chat => (
                        <button 
                            key={chat.id} 
                            onClick={() => selectChat(chat)}
                            className={clsx(
                                "w-full p-4 flex items-center gap-3 text-left hover:bg-[var(--card-hover)] transition-all group",
                                selectedUser?.id === chat.id && "bg-blue-500/10 border-l border-blue-500"
                            )}
                        >
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-full bg-[var(--card)] overflow-hidden flex items-center justify-center border border-[var(--border)] shrink-0">
                                    {chat.avatarUrl ? (
                                        <img 
                                            src={chat.avatarUrl} 
                                            className="w-full h-full object-cover" 
                                            style={{ objectPosition: chat.avatarPosition ? `${chat.avatarPosition.x}% ${chat.avatarPosition.y}%` : 'center' }}
                                        />
                                    ) : <span className="text-[var(--foreground)] font-bold">{chat.email[0]}</span>}
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 animate-in zoom-in">
                                        {chat.unreadCount}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h4 className={clsx("font-bold text-sm truncate", chat.unreadCount > 0 ? "text-[var(--foreground)]" : "text-[var(--muted)]")}>
                                        {chat.email.split('@')[0]}
                                    </h4>
                                    <span className="text-[10px] text-slate-500">{new Date(chat.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className={clsx("text-xs truncate mt-1 italic pr-2", chat.unreadCount > 0 ? "text-blue-400 font-bold" : "text-[var(--muted)]")}>
                                    {chat.lastMessage}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Main: Active Conversation */}
      <div className={clsx(
          "flex-1 flex flex-col relative overflow-hidden transition-all duration-300",
          showSidebar && "hidden md:flex"
      )}>
        {selectedUser ? (
            <>
                {/* Header */}
                <div className="h-20 px-4 md:px-8 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/40">
                    <div className="flex items-center gap-2 md:gap-4">
                        <button 
                            onClick={() => setShowSidebar(true)}
                            className="md:hidden p-2 -ml-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] font-bold border border-[var(--border)] overflow-hidden shrink-0">
                                {selectedUser.avatarUrl ? (
                                    <img 
                                        src={selectedUser.avatarUrl} 
                                        className="w-full h-full object-cover" 
                                        style={{ objectPosition: selectedUser.avatarPosition ? `${selectedUser.avatarPosition.x}% ${selectedUser.avatarPosition.y}%` : 'center' }}
                                    />
                                ) : selectedUser.email[0]}
                            </div>
                            {selectedUser.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-black text-[var(--foreground)]">{selectedUser.email.split('@')[0]}</h3>
                            <div className="flex items-center gap-2">
                                <div className={clsx("w-2 h-2 rounded-full", selectedUser.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-500")}></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {selectedUser.isOnline ? "Online Now" : `Last seen ${formatLastSeen(selectedUser.lastSeen)}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/5">
                    {messages.map((msg, idx) => {
                        const isMine = msg.senderId === currentUser?.id;
                        const isLastInGroup = idx === messages.length - 1 || messages[idx + 1].senderId !== msg.senderId;
                        
                        return (
                            <div key={msg.id || idx} className={clsx("flex w-full gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
                                {/* Avatar */}
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

                                <div className={clsx("flex flex-col max-w-[70%] group", isMine ? "items-end" : "items-start")}>
                                    <div className="relative">
                                        <div className={clsx(
                                            "px-4 py-2.5 rounded-[20px] text-sm leading-relaxed shadow-sm transition-all",
                                            isMine 
                                                ? "bg-blue-600 text-white rounded-br-none" 
                                                : "bg-[var(--card)] text-[var(--foreground)] rounded-bl-none border border-[var(--border)]"
                                        )}>
                                            {msg.content}
                                        </div>

                                        {/* Reactions Display */}
                                        {msg.reactions?.length > 0 && (
                                            <div className={clsx(
                                                "absolute -bottom-3 flex items-center bg-[var(--card)] border border-[var(--border)] rounded-full px-1.5 py-0.5 shadow-lg",
                                                isMine ? "right-0" : "left-0"
                                            )}>
                                                {msg.reactions.map((r) => (
                                                    <span key={r.userId} className="text-xs">
                                                        {r.type === 'LIKE' ? '👍' : r.type === 'LOVE' ? '❤️' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reaction Trigger Button */}
                                        <button 
                                            onClick={() => handleReact(msg.id, msg.reactions?.some((r) => r.userId === currentUser?.id && r.type === 'LIKE') ? 'UNLIKE' : 'LIKE')}
                                            className={clsx(
                                                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-[var(--foreground)]/10",
                                                isMine ? "-left-12" : "-right-12"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-4 h-4 transition-colors",
                                                msg.reactions?.some((r) => r.userId === currentUser?.id) ? "text-blue-500 fill-blue-500" : "text-[var(--muted)]"
                                            )}>
                                                👍
                                            </div>
                                        </button>
                                    </div>
                                    
                                    <div className="mt-1 flex items-center gap-1.5 px-1 opacity-40 hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] font-bold uppercase tracking-tight">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMine && (
                                            msg.isRead 
                                                ? <CheckCheck className="w-3 h-3 text-emerald-500" /> 
                                                : <Check className="w-3 h-3" />
                                        )}
                                        {isMine && (
                                            <button 
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-rose-500 hover:text-rose-400"
                                                title="Unsend"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-[var(--background)]/60 border-t border-[var(--border)] flex gap-3 items-center">
                    <div className="flex-1 relative flex items-center">
                        <input 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-full px-5 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={!input.trim()}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:bg-[var(--muted)]"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="w-24 h-24 rounded-3xl bg-[var(--card)] flex items-center justify-center mb-8 border border-[var(--border)]">
                    <MessageSquare className="w-12 h-12 text-[var(--muted)]" />
                </div>
                <h3 className="text-2xl font-black text-[var(--foreground)] italic tracking-tight mb-2">Secure Comms Interface</h3>
                <p className="text-[var(--muted)] max-w-sm text-sm">Select a contact from the terminal directory to start a real-time encrypted data stream.</p>
            </div>
        )}
      </div>
    </div>
  );
}
