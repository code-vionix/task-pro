
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWelcome from '../components/chat/ChatWelcome';
import ChatWindow from '../components/chat/ChatWindow';
import RestrictedAccess from '../components/chat/RestrictedAccess';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MOCK_CHATS_SETS, getSeededSet } from '../lib/guestMockData';

/**
 * Chat Page
 * Orchestrates the entire real-time messaging ecosystem.
 * Refactored into highly modular sub-components for peak maintainability.
 */
export default function Chat() {
  const { user: currentUser, guestDataSeed } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');

  // State Management
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Logical Restrictions
  const isGuest = currentUser?.role === 'GUEST';
  const guestChats = useMemo(() => isGuest ? getSeededSet(MOCK_CHATS_SETS, guestDataSeed) : [], [isGuest, guestDataSeed]);
  
  const isMessageRestricted = currentUser?.role !== 'ADMIN' && !currentUser?.canMessage;
  const isSocialRestricted = currentUser?.role !== 'ADMIN' && !currentUser?.canUseCommunity;
  const isTotallyBlocked = isMessageRestricted || isSocialRestricted;

  // 1. Socket Lifecycle & Transmission Listeners
  useEffect(() => {
    if (!currentUser?.id || isGuest || isTotallyBlocked) {
        if (isGuest) setChats(guestChats);
        return;
    }

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { userId: currentUser.id },
    });
    setSocket(newSocket);

    // Event: Incoming Message Fragment
    newSocket.on('newMessage', (msg) => {
        setMessages(prev => {
            const isRelevant = msg.senderId === selectedUser?.id || msg.receiverId === selectedUser?.id;
            if (isRelevant) {
                if (msg.senderId === selectedUser?.id) {
                    newSocket.emit('markAsRead', { senderId: msg.senderId, userId: currentUser.id });
                    api.patch(`/messages/read/${msg.senderId}`);
                }
                return [...prev, msg];
            }
            return prev;
        });
        fetchChats();
    });

    // Event: Emotional Reaction Pulse
    newSocket.on('messageReaction', ({ messageId, reaction }) => {
        setMessages(prev => prev.map(m => 
            m.id === messageId 
                ? { ...m, reactions: [...(m.reactions?.filter((r) => r.userId !== reaction.userId) || []), reaction] } 
                : m
        ));
    });

    // Event: Read Synchronization
    newSocket.on('messagesRead', ({ readerId }) => {
        if (selectedUser?.id === readerId) {
            setMessages(prev => prev.map(m => m.receiverId === readerId ? { ...m, isRead: true } : m));
        }
        setChats(prev => prev.map(chat => chat.id === readerId ? { ...chat, lastMessageIsRead: true } : chat));
    });

    // Event: Entity Presence Updates
    newSocket.on('userStatusChanged', ({ userId, isOnline }) => {
        setChats(prev => prev.map(chat => 
            chat.id === userId ? { ...chat, isOnline, lastSeen: new Date() } : chat
        ));
        if (selectedUser?.id === userId) {
            setSelectedUser(prev => prev ? { ...prev, isOnline, lastSeen: new Date() } : prev);
        }
    });

    // Event: Signal Erasure
    newSocket.on('messageDeleted', ({ messageId }) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        fetchChats();
    });

    return () => newSocket.disconnect();
  }, [currentUser?.id, isGuest, isTotallyBlocked, selectedUser?.id]);

  // 2. Data Acquisition
  const fetchChats = async () => {
    if (isGuest || isTotallyBlocked) return;
    try {
      const res = await api.get('/messages/chats');
      setChats(res.data);
    } catch (err) { console.error('Acquisition failure: Chats', err); }
  };

  const fetchUserInfo = async (id) => {
    try {
      const res = await api.get(`/users/${id}`);
      setSelectedUser(res.data);
    } catch (err) { console.error('Acquisition failure: Entity', err); }
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
    } catch (err) { console.error('Acquisition failure: Decryption', err); }
  };

  useEffect(() => {
    if (!isGuest && !isTotallyBlocked) fetchChats();
    if (targetUserId) {
        fetchUserInfo(targetUserId);
        fetchConversation(targetUserId);
    }
  }, [targetUserId, isGuest, isTotallyBlocked]);

  // 3. Operational Handlers
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (isGuest) return toast.error("Guest Protocol: Transmission restricted.");
    if (!input.trim() || !selectedUser || !socket) return;

    const messageData = { senderId: currentUser?.id, receiverId: selectedUser.id, content: input };
    socket.emit('sendMessage', messageData, (response) => {
        setMessages(prev => [...prev, response]);
        fetchChats();
    });
    setInput('');
  };

  const handleSelectChat = (user) => {
    setSelectedUser(user);
    fetchConversation(user.id);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const handleReact = (messageId, type) => {
    if (isGuest) return toast.error("Guest Protocol: Feedback restricted.");
    if (!socket || !selectedUser) return;
    socket.emit('reactToMessage', { messageId, type, userId: currentUser?.id, receiverId: selectedUser.id });
    
    // Optimistic Update
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, reactions: [...(m.reactions?.filter((r) => r.userId !== currentUser?.id) || []), { userId: currentUser?.id, type }] } 
        : m
    ));
  };

  const handleDeleteMessage = (messageId) => {
    if (isGuest || !socket || !selectedUser) return;
    if (confirm('Permanently erase this signal fragment?')) {
        socket.emit('deleteMessage', { messageId, userId: currentUser?.id, receiverId: selectedUser.id });
        setMessages(prev => prev.filter(m => m.id !== messageId));
        fetchChats();
    }
  };

  const formatLastSeen = (date) => {
    if (!date) return 'Unknown';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-160px)] flex border border-[var(--border)] glass rounded-[2rem] overflow-hidden shadow-2xl relative">
        
        {/* 1. Universal Security Overlay */}
        {(isGuest || isTotallyBlocked) && (
            <RestrictedAccess 
                isTotallyBlocked={isTotallyBlocked} 
                isGuest={isGuest} 
                onRegister={() => toast.success("Identity registration terminal opening...")}
            />
        )}

        {/* 2. Primary Navigation: Conversations List */}
        <ChatSidebar 
          chats={chats} 
          selectedUser={selectedUser} 
          onSelectChat={handleSelectChat} 
          isGuest={isGuest} 
          showSidebar={showSidebar} 
        />

        {/* 3. Secondary Navigation: Content Pane */}
        <main className={clsx(
          "flex-1 flex flex-col relative overflow-hidden transition-all duration-300",
          showSidebar && "hidden md:flex"
        )}>
          {selectedUser ? (
            <ChatWindow 
                selectedUser={selectedUser}
                messages={messages}
                currentUser={currentUser}
                isGuest={isGuest}
                onBack={() => setShowSidebar(true)}
                onSend={handleSendMessage}
                input={input}
                setInput={setInput}
                onReact={handleReact}
                onDelete={handleDeleteMessage}
                formatLastSeen={formatLastSeen}
            />
          ) : (
            <ChatWelcome isGuest={isGuest} />
          )}
        </main>
    </div>
  );
}
