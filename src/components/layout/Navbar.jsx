
import clsx from 'clsx';
import { Bell, LogOut, MessageCircle, Moon, Search, Settings, Sun, User as UserIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ 
  user, 
  theme, 
  toggleTheme, 
  unreadMessages, 
  unreadCount, 
  renderNotifications, 
  notifications, 
  handleMarkAllAsRead,
  logout
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

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

  return (
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
                    logout();
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
  );
}
