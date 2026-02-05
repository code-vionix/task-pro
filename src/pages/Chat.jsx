
import clsx from 'clsx';
import { ArrowLeft, Check, CheckCheck, MessageCircle, Search, Send, ShieldAlert, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MOCK_CHATS_SETS, getSeededSet } from '../lib/guestMockData';

export default function Chat() {
  const { user: currentUser, guestDataSeed } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');

  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const isGuest = currentUser?.role === 'GUEST';
  const guestChats = useMemo(() => isGuest ? getSeededSet(MOCK_CHATS_SETS, guestDataSeed) : [], [isGuest, guestDataSeed]);
    const isMessageRestricted = currentUser?.role !== 'ADMIN' && !currentUser?.canMessage;
    const isSocialRestricted = currentUser?.role !== 'ADMIN' && !currentUser?.canUseCommunity;
    
    // Total block if social is off? Or just message?
    const isTotallyBlocked = isMessageRestricted || isSocialRestricted;

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    if (isGuest) {
        setChats(guestChats);
        return;
    }

    if (isTotallyBlocked) {
        setChats([]);
        return;
    }

    // Connect to Socket.io
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { userId: currentUser.id },
    });
    setSocket(newSocket);

    newSocket.on('newMessage', (msg) => {
        setMessages(prev => {
            if (msg.senderId === selectedUser?.id || msg.receiverId === selectedUser?.id) {
                if (msg.senderId === selectedUser?.id && !isGuest) {
                    // Note: markAsRead logic is now in a useEffect triggered by selectedUser or message updates
                    newSocket.emit('markAsRead', { senderId: msg.senderId, userId: currentUser.id });
                    api.patch(`/messages/read/${msg.senderId}`).then(() => {
                        window.dispatchEvent(new CustomEvent('messagesRead'));
                    });
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
  }, [currentUser?.id, selectedUser?.id, isGuest]);

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
    if (!isGuest) fetchChats();
    if (targetUserId) {
        fetchUserInfo(targetUserId);
        fetchConversation(targetUserId);
    }
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Mark messages as read when new messages arrive while user is already selected
    if (selectedUser && !isGuest && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.senderId === selectedUser.id && !lastMsg.isRead) {
             socket?.emit('markAsRead', { senderId: selectedUser.id, userId: currentUser?.id });
             api.patch(`/messages/read/${selectedUser.id}`).then(() => {
                 window.dispatchEvent(new CustomEvent('messagesRead'));
             });
        }
    }
  }, [messages, selectedUser, isGuest, socket, currentUser?.id]);

  // Mark as read when selected user changes (initial load or switch)
  useEffect(() => {
    if (selectedUser && !isGuest) {
        setChats(prev => prev.map(c => c.id === selectedUser.id ? { ...c, unreadCount: 0 } : c));
        socket?.emit('markAsRead', { senderId: selectedUser.id, userId: currentUser?.id });
        api.patch(`/messages/read/${selectedUser.id}`).then(() => {
            window.dispatchEvent(new CustomEvent('messagesRead'));
        });
    }
  }, [selectedUser?.id, isGuest, socket, currentUser?.id]);

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
    if (isGuest) {
        setMessages([
            { id: 'gm-1', content: 'Simulation message initialized...', createdAt: new Date().toISOString(), senderId: id, sender: { email: 'demo_user' } },
            { id: 'gm-2', content: 'Protocol synchronization complete.', createdAt: new Date().toISOString(), senderId: currentUser.id, sender: { email: 'guest' } }
        ]);
        return;
    }
    try {
      const res = await api.get(`/messages/conversation/${id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (isGuest) return toast.error("Guest Mode: Sending restricted.");
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
      if (window.innerWidth < 768) {
          setShowSidebar(false);
      }
  };

  const handleReact = (messageId, type) => {
      if (isGuest) return toast.error("Guest Mode: Reactions restricted.");
      if (!socket || !selectedUser) return;
      socket.emit('reactToMessage', { 
          messageId, 
          type, 
          userId: currentUser?.id, 
          receiverId: selectedUser.id 
      });
      setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, reactions: [...(m.reactions?.filter((r) => r.userId !== currentUser?.id) || []), { userId: currentUser?.id, type }] } 
            : m
      ));
  };

  const handleDeleteMessage = (messageId) => {
      if (isGuest) return;
      if (!socket || !selectedUser) return;
      if (confirm('Unsend this message?')) {
          socket.emit('deleteMessage', { messageId, userId: currentUser?.id, receiverId: selectedUser.id });
          setMessages(prev => prev.filter(m => m.id !== messageId));
          fetchChats();
      }
  };

  return (
    <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-160px)] flex border border-[var(--border)] glass rounded-xl md:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-500 relative">
        {(isGuest || isTotallyBlocked) && (
            <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-3xl shadow-2xl animate-in zoom-in max-w-sm">
                    <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-[var(--foreground)] mb-2 uppercase tracking-tighter italic">
                        {isTotallyBlocked ? "Access Restricted" : "Guest Mode"}
                    </h3>
                    <p className="text-sm text-[var(--muted)] font-medium mb-6">
                        {isTotallyBlocked 
                            ? "Your communications have been suspended by security command. Consult with an administrator to restore access."
                            : "You are currently in Observation Mode. Transmitting signals is restricted to registered entities."
                        }
                    </p>
                    {isGuest && (
                        <button className="w-full premium-gradient text-white py-3 rounded-2xl font-black uppercase text-xs tracking-widest">
                            Register Identity
                        </button>
                    )}
                </div>
            </div>
        )}
      <div className={clsx(
          "w-full md:w-80 border-r border-[var(--border)] flex flex-col bg-[var(--background)]/30 transition-all duration-300",
          !showSidebar && "hidden md:flex",
          showSidebar && "flex"

      )}>
        <div className="p-6 border-b border-[var(--border)]">
            <h2 className="text-xl font-black text-[var(--foreground)] italic tracking-tight mb-4 uppercase text-blue-500">Messages</h2>
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
                                {chat.unreadCount > 0 && !isGuest && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 animate-in zoom-in">
                                        {chat.unreadCount}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h4 className={clsx("font-bold text-sm truncate", chat.unreadCount > 0 && !isGuest ? "text-[var(--foreground)]" : "text-[var(--muted)]")}>
                                        {chat.email.split('@')[0]}
                                    </h4>
                                    <span className="text-[10px] text-slate-500">{new Date(chat.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className={clsx("text-xs truncate mt-1 italic pr-2", chat.unreadCount > 0 && !isGuest ? "text-blue-400 font-bold" : "text-[var(--muted)]")}>
                                    {chat.lastMessage}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      <div className={clsx(
          "flex-1 flex flex-col relative overflow-hidden transition-all duration-300",
          showSidebar && "hidden md:flex"
      )}>
        {selectedUser ? (
            <>
                <div className="h-20 px-4 md:px-8 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/40 relative">
                    {isGuest && (
                        <div className="absolute inset-0 bg-amber-500/5 backdrop-blur-[1px] z-[1] flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 opacity-20">Guest Mode</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 md:gap-4 z-[2]">
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
                            <h3 className="font-black text-[var(--foreground)] uppercase tracking-tight">{selectedUser.email.split('@')[0]}</h3>
                            <div className="flex items-center gap-2">
                                <div className={clsx("w-2 h-2 rounded-full", selectedUser.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-500")}></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {selectedUser.isOnline ? "Online Now" : `Last seen ${formatLastSeen(selectedUser.lastSeen)}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/5">
                    {messages.map((msg, idx) => {
                        const isMine = msg.senderId === currentUser?.id;
                        const isLastInGroup = idx === messages.length - 1 || messages[idx + 1].senderId !== msg.senderId;
                        
                        return (
                            <div key={msg.id || idx} className={clsx("flex w-full gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
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

                                        {msg.reactions?.length > 0 && (
                                            <div className={clsx(
                                                "absolute -bottom-3 flex items-center bg-[var(--card)] border border-[var(--border)] rounded-full px-1.5 py-0.5 shadow-lg",
                                                isMine ? "right-0" : "left-0"
                                            )}>
                                                {msg.reactions.map((r, i) => (
                                                    <span key={i} className="text-xs">
                                                        {r.type === 'LIKE' ? '👍' : r.type === 'LOVE' ? '❤️' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <button 
                                            onClick={() => handleReact(msg.id, msg.reactions?.some((r) => r.userId === currentUser?.id && r.type === 'LIKE') ? 'UNLIKE' : 'LIKE')}
                                            disabled={isGuest}
                                            className={clsx(
                                                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-[var(--foreground)]/10",
                                                isMine ? "-left-12" : "-right-12",
                                                isGuest && "cursor-not-allowed"
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
                                        {isMine && !isGuest && (
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

                <form onSubmit={handleSendMessage} className="p-4 bg-[var(--background)]/60 border-t border-[var(--border)] flex gap-3 items-center relative">
                    <div className="flex-1 relative flex items-center">
                        <input 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={isGuest ? "Messaging limited in guest mode" : "Type a message..."}
                            disabled={isGuest}
                            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-full px-5 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-50"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={!input.trim() || isGuest}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-700"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="w-24 h-24 rounded-3xl bg-[var(--card)] flex items-center justify-center mb-8 border border-[var(--border)] shadow-xl relative group">
                    <MessageCircle className="w-12 h-12 text-[var(--muted)] group-hover:text-blue-500 transition-colors" />
                    {isGuest && <ShieldAlert className="w-6 h-6 text-amber-500 absolute -top-2 -right-2" />}
                </div>
                <h3 className="text-2xl font-black text-[var(--foreground)] italic tracking-tight mb-2 uppercase italic">Chat</h3>
                <p className="text-[var(--muted)] max-w-sm text-sm font-medium">Select a user to start chatting.</p>
                {isGuest && (
                    <div className="mt-6 px-4 py-2 border border-amber-500/20 bg-amber-500/5 rounded-xl text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                        <ShieldAlert className="w-4 h-4" />
                        Guest Mode: Demo Data Loaded
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
