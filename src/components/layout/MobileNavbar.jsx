
import { Bell, LayoutDashboard, Menu, MessageCircle, Moon, Sun, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MobileNavbar({ 
  isMenuOpen, 
  setIsMenuOpen, 
  unreadMessages, 
  unreadCount, 
  isNotificationOpen, 
  setIsNotificationOpen, 
  renderNotifications, 
  handleMarkAllAsRead, 
  theme, 
  toggleTheme,
  notificationRef 
}) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="p-2 text-[var(--muted)] hover:text-blue-500 transition-colors"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2 ml-1">
          <div className="w-8 h-8 rounded-lg premium-gradient flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black italic tracking-tighter">TASK<span className="text-blue-500">PRO</span></span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
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
            </div>
          )}
        </div>

        <button 
          onClick={toggleTheme}
          className="p-2 text-[var(--muted)] hover:text-blue-500 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
