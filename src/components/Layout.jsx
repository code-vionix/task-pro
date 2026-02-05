
import clsx from 'clsx';
import { AlertTriangle, Bell, Heart, MessageCircle, MessageSquare, Share2, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { navigationItems } from '../lib/navigation';
import { logout as logoutAction } from '../store/slices/authSlice';
import { toggleTheme as toggleThemeAction } from '../store/slices/themeSlice';
import SetProfilePopup from './SetProfilePopup';
import MobileMenu from './layout/MobileMenu';
import MobileNavbar from './layout/MobileNavbar';
import Navbar from './layout/Navbar';
import Sidebar from './layout/Sidebar';

const NOTIFICATION_ICONS = {
  REACTION: Heart,
  COMMENT: MessageSquare,
  SHARE: Share2,
  TASK_ASSIGNED: Bell,
  MESSAGE: MessageCircle,
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { mode: theme } = useSelector(state => state.theme);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const notificationRef = useRef(null);

  const isGuest = user?.role === 'GUEST';

  // Navigation items filtered by role
  const filteredNavItems = navigationItems.filter(item => {
    if (!item.roles) return true;
    if (isGuest) return false;
    return item.roles.includes(user?.role);
  });

  useEffect(() => {
    if (user && !user.name && user.role !== 'GUEST' && user.role !== 'ADMIN') {
      setShowProfilePrompt(true);
    }
  }, [user]);

  useEffect(() => {
    if (isGuest) {
      const interval = setInterval(() => {
        if (!showGuestPopup) setShowGuestPopup(true);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isGuest, showGuestPopup]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadMessages();
      
      const handleNewNotification = () => fetchNotifications();
      const handleNewMessage = () => fetchUnreadMessages();
      
      window.addEventListener('newNotification', handleNewNotification);
      window.addEventListener('newMessage', handleNewMessage);
      window.addEventListener('messagesRead', handleNewMessage);
      
      return () => {
        window.removeEventListener('newNotification', handleNewNotification);
        window.removeEventListener('newMessage', handleNewMessage);
        window.removeEventListener('messagesRead', handleNewMessage);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const filtered = response.data.filter(n => n.type !== 'MESSAGE');
      setNotifications(filtered);
      setUnreadCount(filtered.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await api.get('/messages/unread-count');
      setUnreadMessages(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await api.patch(`/notifications/${notification.id}/read`);
      fetchNotifications();
    }
    const data = notification.data || {};
    switch (notification.type) {
      case 'REACTION': case 'COMMENT': case 'SHARE':
        if (data.postId) navigate('/community', { state: { scrollToPost: data.postId } });
        break;
      case 'TASK_ASSIGNED': navigate('/my-tasks'); break;
      case 'MESSAGE': navigate(data.roomId ? `/chat?room=${data.roomId}` : '/chat'); break;
      default: break;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/login');
  };

  const toggleTheme = () => dispatch(toggleThemeAction());

  const renderNotifications = () => (
    <>
      <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card)]/50">
          <span className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">
              {unreadCount} New
            </span>
          )}
      </div>
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-[var(--muted)] mx-auto mb-3 opacity-50" />
              <p className="text-sm text-[var(--muted)] font-medium">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = NOTIFICATION_ICONS[n.type] || Bell;
              return (
                <div 
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={clsx(
                    "p-4 border-b border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer",
                    !n.isRead && "bg-blue-500/5"
                  )}
                >
                  <div className="flex gap-3">
                      <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", n.isRead ? "bg-[var(--card)]" : "bg-blue-500/20")}>
                          <Icon className={clsx("w-5 h-5", n.isRead ? "text-[var(--muted)]" : "text-blue-500")} />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--foreground)] font-medium leading-relaxed">{n.message}</p>
                          <span className="text-xs text-[var(--muted)] font-medium mt-1 block">{formatTimeAgo(n.createdAt)}</span>
                      </div>
                  </div>
                </div>
              );
            })
          )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans selection:bg-blue-500/30">
      
      {isGuest && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500/20 backdrop-blur-md border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 z-[70]">
          <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-500">Guest Mode — Limited Interaction</span>
        </div>
      )}

      {/* 1. Mobile Top Navbar */}
      <MobileNavbar 
        isMenuOpen={isMobileMenuOpen}
        setIsMenuOpen={setIsMobileMenuOpen}
        unreadMessages={unreadMessages}
        unreadCount={unreadCount}
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
        renderNotifications={renderNotifications}
        handleMarkAllAsRead={handleMarkAllAsRead}
        theme={theme}
        toggleTheme={toggleTheme}
        notificationRef={notificationRef}
      />

      {/* 2. Desktop Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        navItems={filteredNavItems}
        user={user}
      />

      {/* 3. Mobile Navigation Menu Overlay */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onItemsClick={() => setIsMobileMenuOpen(false)}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={filteredNavItems}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className={clsx("flex-1 flex flex-col relative transition-all duration-500 w-full overflow-hidden", isGuest ? "pt-12" : "pt-0", "md:pt-0 pt-16")}>
        
        {/* 4. Desktop Top Bar Header */}
        <Navbar 
          user={user}
          theme={theme}
          toggleTheme={toggleTheme}
          unreadMessages={unreadMessages}
          unreadCount={unreadCount}
          renderNotifications={renderNotifications}
          notifications={notifications}
          handleMarkAllAsRead={handleMarkAllAsRead}
          logout={handleLogout}
        />

        {/* 5. Central Viewport (Pages) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* 6. Modals & Popups */}
      {showProfilePrompt && <SetProfilePopup user={user} onComplete={() => setShowProfilePrompt(false)} />}
      {showGuestPopup && <GuestRegistrationPopup onLogout={handleLogout} onClose={() => setShowGuestPopup(false)} />}
    </div>
  );
}

function GuestRegistrationPopup({ onLogout, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in duration-500">
      <div className="bg-[var(--card)] border border-blue-500/30 w-full max-w-md rounded-[2.5rem] shadow-[0_0_100px_rgba(59,130,246,0.1)] overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="p-10 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          <div className="mb-8 relative inline-block">
            <div className="w-24 h-24 rounded-3xl premium-gradient flex items-center justify-center mx-auto shadow-2xl rotate-3">
              <Sparkles className="w-12 h-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce">LIMITED ACCESS</div>
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter text-[var(--foreground)] mb-4">Unlock Full Potential</h2>
          <p className="text-[var(--muted)] font-medium leading-relaxed mb-10">
            You've explored the <span className="text-blue-500 font-bold">Simulator</span>. Now, step into the real arena. 
            Register today to start tasking, posting, and communicating across our secure neural network.
          </p>
          <div className="flex flex-col gap-4">
            <button onClick={onLogout} className="premium-gradient text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all">Register Now</button>
            <button onClick={onClose} className="bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--foreground)] py-4 rounded-2xl font-bold transition-all text-sm">Continue as Guest</button>
          </div>
        </div>
      </div>
    </div>
  );
}
