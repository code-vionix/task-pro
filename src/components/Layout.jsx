import clsx from 'clsx';
import { AlertTriangle, Bell, ChevronLeft, ChevronRight, Heart, LayoutDashboard, LogOut, Menu, MessageCircle, MessageSquare, Moon, Search, Settings, Share2, ShieldAlert, Sparkles, Sun, UserCheck, User as UserIcon, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import SetProfilePopup from './SetProfilePopup';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'My Tasks', icon: UserCheck, path: '/my-tasks' },
  { label: 'Community', icon: Users, path: '/community' },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
  { label: 'System Control', icon: ShieldAlert, path: '/admin', roles: ['ADMIN'] },
];

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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMuted } = useSocket();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const isGuest = user?.role === 'GUEST';

  useEffect(() => {
    if (user && !user.name) {
      if (user.role !== 'GUEST' && user.role !== 'ADMIN') {
          setShowProfilePrompt(true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (isGuest) {
        const interval = setInterval(() => {
            if (!showGuestPopup) {
                setShowGuestPopup(true);
            }
        }, 60000);
        return () => clearInterval(interval);
    }
  }, [isGuest, showGuestPopup]);

  useEffect(() => {
    function handleClickOutside(event) {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
            setIsUserMenuOpen(false);
        }
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setIsNotificationOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadMessages();
      
      // Listen for new notifications
      const handleNewNotification = (event) => {
        fetchNotifications();
      };
      
      // Listen for new messages
      const handleNewMessage = () => {
        fetchUnreadMessages();
      };
      
      window.addEventListener('newNotification', handleNewNotification);
      window.addEventListener('newMessage', handleNewMessage);
      window.addEventListener('messagesRead', handleNewMessage); // reuse handleNewMessage to fetch count
      
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
      // Filter out message notifications - they are handled by the message icon badge
      const filteredNotifications = response.data.filter(n => n.type !== 'MESSAGE');
      setNotifications(filteredNotifications);
      const unread = filteredNotifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
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
    // Mark as read
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // Close dropdown
    setIsNotificationOpen(false);

    // Navigate based on notification type
    const data = notification.data || {};
    
    switch (notification.type) {
      case 'REACTION':
      case 'COMMENT':
      case 'SHARE':
        // Navigate to community and scroll to post
        if (data.postId) {
          navigate('/community', { state: { scrollToPost: data.postId } });
        }
        break;
      
      case 'TASK_ASSIGNED':
        // Navigate to my tasks
        navigate('/my-tasks');
        break;
      
      case 'MESSAGE':
        // Navigate to chat room
        if (data.roomId) {
          navigate(`/chat?room=${data.roomId}`);
        } else {
          navigate('/chat');
        }
        break;
      
      default:
        // Do nothing
        break;
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
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
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (isGuest) return false; 
    return item.roles.includes(user?.role);
  });

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
            notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
              return (
                <div 
                  key={notification.id}
                  onClick={() => {
                      handleNotificationClick(notification);
                      setIsNotificationOpen(false);
                  }}
                  className={clsx(
                    "p-4 border-b border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer",
                    !notification.isRead && "bg-blue-500/5"
                  )}
                >
                  <div className="flex gap-3">
                      <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        notification.isRead ? "bg-[var(--card)]" : "bg-blue-500/20"
                      )}>
                          <Icon className={clsx("w-5 h-5", notification.isRead ? "text-[var(--muted)]" : "text-blue-500")} />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--foreground)] font-medium leading-relaxed">
                              {notification.message}
                          </p>
                          <span className="text-xs text-[var(--muted)] font-medium mt-1 block">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
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
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-500">
                  Guest Mode — Limited Interaction
              </span>
          </div>
      )}

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-2">
              <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                  className="p-2 text-[var(--muted)] hover:text-blue-500 transition-colors"
              >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-2 ml-1">
                  <div className="w-8 h-8 rounded-lg premium-gradient flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-black italic tracking-tighter">TASK<span className="text-blue-500">PRO</span></span>
              </div>
          </div>
          
          <div className="flex items-center gap-2">
              {/* Mobile Message Notification */}
              <Link 
                to="/chat"
                className="relative p-2 text-[var(--muted)] hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-green-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Mobile Bell Notification */}
              <div className="relative" ref={notificationRef}>
                  <button 
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative p-2 text-[var(--muted)] hover:text-blue-500 transition-colors"
                  >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                  </button>
                  {isNotificationOpen && (
                      <div className="md:hidden fixed top-16 right-4 left-4 glass border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden py-0 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                          {renderNotifications()}
                          {notifications.length > 0 && unreadCount > 0 && (
                            <div className="p-2 border-t border-[var(--border)] text-center bg-[var(--card)]/80">
                                <button 
                                  onClick={() => {
                                      handleMarkAllAsRead();
                                      setIsNotificationOpen(false);
                                  }}
                                  className="text-xs font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                                >
                                    Mark all read
                                </button>
                            </div>
                          )}
                      </div>
                  )}
              </div>

              {/* Mobile Theme Toggle */}
              <button 
                  onClick={() => toggleTheme()}
                  className="p-2 text-[var(--muted)] hover:text-blue-500 transition-colors"
              >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
          </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside 
        className={clsx(
          "relative hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--background)] transition-all duration-500 ease-in-out group",
          isSidebarOpen ? "w-72" : "w-24"
        )}
      >
        <div className="p-8 flex items-center justify-between">
          <Link to="/" className={clsx("flex items-center gap-4 transition-all duration-500", !isSidebarOpen && "scale-110")}>
            <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:rotate-12 transition-transform">
                <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
                <span className="text-2xl font-black italic tracking-tighter animate-in fade-in slide-in-from-left-4 duration-500">
                    TASK<span className="text-blue-500">PRO</span>
                </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group/item relative overflow-hidden",
                  isActive 
                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5" 
                    : "text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon className={clsx("w-6 h-6 transition-transform duration-300 group-hover/item:scale-110", isActive && "text-blue-500")} />
                {isSidebarOpen && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/50" />
                )}
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[var(--card)] border border-[var(--border)] rounded-full flex items-center justify-center hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group/toggle z-10"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="absolute left-0 top-0 bottom-0 w-80 bg-[var(--background)] shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-500">
                  <div className="flex justify-between items-center mb-10">
                       <span className="text-2xl font-black italic">TASK<span className="text-blue-500">PRO</span></span>
                       <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl bg-[var(--card-hover)]">
                           <X className="w-6 h-6" />
                       </button>
                  </div>
                  <nav className="flex-1 space-y-2">
                       {filteredNavItems.map((item) => (
                           <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={clsx(
                                    "flex items-center gap-4 p-5 rounded-2xl font-bold transition-all",
                                    location.pathname === item.path ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20" : "text-[var(--muted)] hover:bg-[var(--card-hover)]"
                                )}
                           >
                               <item.icon className="w-6 h-6" />
                               <span>{item.label}</span>
                           </Link>
                       ))}
                  </nav>
                  <button onClick={handleLogout} className="mt-auto flex items-center gap-4 p-5 rounded-2xl text-rose-500 bg-rose-500/10 font-black uppercase tracking-widest transition-all">
                      <LogOut className="w-6 h-6" />
                      <span>Logout</span>
                  </button>
              </div>
          </div>
      )}

      {/* Main Content */}
      <main className={clsx(
          "flex-1 flex flex-col relative transition-all duration-500 w-full overflow-hidden",
          isGuest ? "pt-12" : "pt-0",
          "md:pt-0 pt-16"
      )}>
        {/* Top Header */}
        <header className="h-20 border-b border-[var(--border)] hidden md:flex items-center justify-between px-10 bg-[var(--background)]/80 backdrop-blur-xl sticky top-0 z-40">
           <div className="relative group">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-blue-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="bg-[var(--card)] border border-[var(--border)] rounded-full pl-12 pr-6 py-2.5 text-sm w-96 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                />
           </div>
           
           <div className="flex items-center gap-8">
               <div className="flex items-center gap-2 p-1 bg-[var(--card)] border border-[var(--border)] rounded-full">
                   <button 
                        onClick={() => theme !== 'light' && toggleTheme()}
                        className={clsx("p-2 rounded-full transition-all", theme === 'light' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-110" : "text-[var(--muted)] hover:bg-[var(--card-hover)]")}
                   >
                        <Sun className="w-4 h-4" />
                   </button>
                   <button 
                        onClick={() => theme !== 'dark' && toggleTheme()}
                        className={clsx("p-2 rounded-full transition-all", theme === 'dark' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-110" : "text-[var(--muted)] hover:bg-[var(--card-hover)]")}
                   >
                        <Moon className="w-4 h-4" />
                   </button>
               </div>
               
               <div className="flex items-center gap-4">
                   {/* Message Icon */}
                   <Link 
                     to="/chat"
                     className="relative p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-[var(--muted)] hover:text-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/5"
                   >
                     <MessageCircle className="w-5 h-5" />
                     {unreadMessages > 0 && (
                       <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-green-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5 animate-pulse">
                         {unreadMessages > 9 ? '9+' : unreadMessages}
                       </span>
                     )}
                   </Link>

                   <div className="relative" ref={notificationRef}>
                       <button 
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className="relative p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-[var(--muted)] hover:text-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/5"
                       >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5 animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                       </button>

                       {isNotificationOpen && (
                            <div className="absolute right-0 mt-2 w-96 glass border border-[var(--border)] rounded-2xl shadow-2xl py-0 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                {renderNotifications()}
                                {notifications.length > 0 && unreadCount > 0 && (
                                  <div className="p-2 border-t border-[var(--border)] text-center bg-[var(--card)]/80">
                                      <button 
                                        onClick={() => {
                                            handleMarkAllAsRead();
                                            setIsNotificationOpen(false);
                                        }}
                                        className="text-xs font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                                      >
                                          Mark all read
                                      </button>
                                  </div>
                                )}
                            </div>
                        )}
                   </div>
                   
                   {/* User Profile Dropdown */}
                   <div className="relative" ref={userMenuRef}>
                        <button 
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-3 p-1.5 pr-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl hover:bg-[var(--card-hover)] transition-all"
                        >
                            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-black text-sm">
                                        {user?.email[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </button>

                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 glass border border-[var(--border)] rounded-2xl shadow-2xl py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                <Link 
                                    to="/profile" 
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[var(--foreground)] hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                                >
                                    <UserIcon className="w-4 h-4" /> Profile
                                </Link>
                                <Link 
                                    to="/settings" 
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[var(--foreground)] hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                                >
                                    <Settings className="w-4 h-4" /> Settings
                                </Link>
                                <div className="my-1 border-t border-[var(--border)]"></div>
                                <button 
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        )}
                   </div>
               </div>
           </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Profile Setup Prompt */}
      {showProfilePrompt && <SetProfilePopup user={user} onComplete={() => setShowProfilePrompt(false)} />}

      {/* Guest Registration Nudge Popup */}
      {showGuestPopup && (
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
                          <button 
                            onClick={handleLogout}
                            className="premium-gradient text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all"
                          >
                              Register Now
                          </button>
                          <button 
                            onClick={() => setShowGuestPopup(false)}
                            className="bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--foreground)] py-4 rounded-2xl font-bold transition-all text-sm"
                          >
                              Continue as Guest
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
