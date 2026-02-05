
import clsx from 'clsx';
import { Bell, ChevronLeft, ChevronRight, Globe, Home, List, LogOut, Menu, MessageSquare, Moon, Settings, Shield, Sun, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import SetProfilePopup from './SetProfilePopup';

export default function Layout() {
  const { user, logout, updateUserInfo } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSetProfile, setShowSetProfile] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    // Show popup if name is missing OR password hash is missing (indirectly check if profile info endpoint says so)
    // For now, based on your request, if name is not set, we force update.
    if (user && !user.name) {
        setShowSetProfile(true);
    }
  }, [user]);

  const handleProfileComplete = async () => {
      try {
          const res = await api.get('/users/profile');
          updateUserInfo(res.data);
          setShowSetProfile(false);
          // Redirect to dashboard to refresh stats and tasks
          navigate('/');
      } catch (err) {
          console.error('Failed to refresh profile', err);
          setShowSetProfile(false);
      }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
      try {
          const res = await api.get('/notifications');
          setNotifications(res.data);
      } catch (err) {
          console.error('Failed to fetch notifications', err);
      }
  };

  const handleNotificationClick = async (notif) => {
      if (!notif.isRead) {
          await api.patch(`/notifications/${notif.id}/read`);
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      }
      setShowNotifications(false);

      if (notif.type === 'MESSAGE' && notif.data?.senderId) {
          navigate(`/chat?user=${notif.data.senderId}`);
      } else if ((notif.type === 'REACTION' || notif.type === 'COMMENT') && notif.data?.postId) {
          navigate(`/community#post-${notif.data.postId}`);
      } else if (notif.type === 'TASK_ASSIGNED') {
          navigate(`/tasks`);
      }
  };

  const markAllAsRead = async () => {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { userId: user.id },
    });

    socket.on('newNotification', (notif) => {
      setNotifications(prev => [notif, ...prev.slice(0, 19)]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans transition-colors duration-300">
      {showSetProfile && <SetProfilePopup user={user} onComplete={handleProfileComplete} />}
      
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 lg:relative lg:translate-x-0 glass border-r border-[var(--border)] flex flex-col z-40 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <div className={clsx("p-6 flex items-center justify-between", isCollapsed ? "flex-col gap-6" : "")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in duration-300">
                <h1 className="text-xl font-black text-[var(--foreground)] tracking-tight uppercase italic leading-none">
                  Task<span className="text-blue-500">Pro</span>
                </h1>
                <span className="text-[10px] font-bold text-[var(--muted)] tracking-[0.2em] uppercase">Enterprise</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={closeSidebar}
            className="p-2 lg:hidden text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {!isCollapsed && (
             <button 
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 hover:bg-[var(--card-hover)] rounded-lg text-[var(--muted)] hover:text-blue-500 transition-all"
             >
                <ChevronLeft className="w-5 h-5" />
             </button>
          )}

          {isCollapsed && (
             <button 
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 hover:bg-[var(--card-hover)] rounded-lg text-[var(--muted)] hover:text-blue-500 transition-all"
             >
                <ChevronRight className="w-5 h-5" />
             </button>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar border-t border-[var(--border)] py-4">
          <NavItem to="/" icon={<Home className="w-5 h-5"/>} label="Dashboard" onClick={closeSidebar} isCollapsed={isCollapsed} />
          <NavItem to="/tasks" icon={<List className="w-5 h-5"/>} label="My Tasks" onClick={closeSidebar} isCollapsed={isCollapsed} />
          <NavItem to="/community" icon={<Globe className="w-5 h-5"/>} label="Community" onClick={closeSidebar} isCollapsed={isCollapsed} />
          <NavItem to="/chat" icon={<MessageSquare className="w-5 h-5"/>} label="Secure Chat" onClick={closeSidebar} isCollapsed={isCollapsed} />
          <NavItem to="/profile" icon={<User className="w-5 h-5"/>} label="My Profile" onClick={closeSidebar} isCollapsed={isCollapsed} />
          
          {user?.role === 'ADMIN' && (
            <>
              <div className={clsx("px-4 py-2 mt-6 text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest", isCollapsed ? "text-center px-0" : "")}>
                {isCollapsed ? "..." : "Admin"}
              </div>
              <NavItem to="/admin" icon={<Shield className="w-5 h-5"/>} label="Control" onClick={closeSidebar} isCollapsed={isCollapsed} />
              <NavItem to="/settings" icon={<Settings className="w-5 h-5"/>} label="Config" onClick={closeSidebar} isCollapsed={isCollapsed} />
            </>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-[var(--border)] space-y-2">
          {!isCollapsed ? (
            <div className="glass-card p-3 flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-surface-main flex items-center justify-center border border-border-main overflow-hidden shrink-0">
                 {user?.avatarUrl ? (
                   <img 
                      src={user.avatarUrl} 
                      className="w-full h-full object-cover" 
                      style={{ objectPosition: user.avatarPosition ? `${user.avatarPosition.x}% ${user.avatarPosition.y}%` : 'center' }}
                   />
                 ) : (
                   <span className="text-xs font-bold text-foreground-main">{user?.email[0].toUpperCase()}</span>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[11px] font-bold text-[var(--foreground)] truncate">{user?.name || user?.email.split('@')[0]}</p>
                 <p className="text-[9px] text-[var(--muted)] truncate lowercase">{user?.role}</p>
              </div>
            </div>
          ) : (
             <div className="flex justify-center mb-2">
                <div className="w-8 h-8 rounded-full bg-surface-main flex items-center justify-center border border-border-main overflow-hidden shrink-0">
                    {user?.avatarUrl ? (
                    <img src={user.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                    <span className="text-xs font-bold text-foreground-main">{user?.email[0].toUpperCase()}</span>
                    )}
                </div>
             </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 border-b border-[var(--border)] px-4 sm:px-8 flex items-center justify-between z-10 backdrop-blur-sm bg-[var(--background)]/50">
           <div className="flex items-center gap-4">
               <button onClick={toggleSidebar} className="p-2 lg:hidden glass-card rounded-xl text-[var(--muted)] transition-all">
                  <Menu className="w-6 h-6" />
               </button>
               <h2 className="text-lg font-bold text-[var(--foreground)] truncate">
                {useLocation().pathname === '/' ? 'Dashboard' : 'Navigation'}
               </h2>
           </div>
           
           <div className="flex items-center gap-3">
               <button onClick={toggleTheme} className="p-2.5 glass-card rounded-xl text-[var(--muted)] transition-all">
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-500" />}
               </button>

               <div className="relative">
                   <button 
                    onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }} 
                    className={clsx("p-2.5 glass-card rounded-xl transition-all relative", showNotifications && "bg-blue-500 text-white")}
                   >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-[var(--background)] flex items-center justify-center text-[8px] font-black text-white">{unreadCount}</span>}
                   </button>
                   {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <div className="absolute right-0 mt-4 w-80 glass-card bg-[var(--background)]/95 border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50">
                          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--foreground)]">Notifications</h3>
                              {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[10px] text-blue-500 font-bold uppercase">Mark read</button>}
                          </div>
                          <div className="max-h-96 overflow-y-auto custom-scrollbar">
                              {notifications.length === 0 ? <div className="p-10 text-center text-[var(--muted)] text-xs italic">Clear</div> : (
                                  <div className="divide-y divide-[var(--border)]">
                                      {notifications.map((n) => (
                                          <button key={n.id} onClick={() => handleNotificationClick(n)} className={clsx("w-full p-4 text-left hover:bg-[var(--card-hover)] transition-colors flex gap-3", !n.isRead && "bg-blue-500/[0.03]")}>
                                              <div className={clsx("w-2 h-2 rounded-full shrink-0 mt-1.5", !n.isRead ? "bg-blue-500 shadow-lg shadow-blue-500/50" : "bg-slate-700")}></div>
                                              <div><p className={clsx("text-xs", !n.isRead ? "text-[var(--foreground)] font-medium" : "text-[var(--muted)]")}>{n.message}</p></div>
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                        </div>
                      </>
                   )}
               </div>

               <div className="relative">
                  <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }} className="flex items-center gap-2 p-1.5 glass-card rounded-xl hover:border-blue-500/50 transition-all">
                    <div className="w-8 h-8 rounded-lg premium-gradient flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
                        {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-white">{user?.email[0].toUpperCase()}</span>}
                    </div>
                  </button>
                  {showUserMenu && (
                     <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                        <div className="absolute right-0 mt-4 w-56 glass-card bg-[var(--background)]/95 border border-[var(--border)] rounded-2xl shadow-2xl z-50 py-2">
                           <div className="px-4 py-3 border-b border-[var(--border)] mb-2">
                               <p className="text-xs font-bold text-[var(--foreground)] truncate">{user?.name || user?.email}</p>
                               <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest">{user?.role}</p>
                           </div>
                           <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-blue-500/10 hover:text-blue-500 transition-all"><User className="w-4 h-4" /> Profile</button>
                           <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-blue-500/10 hover:text-blue-500 transition-all"><Settings className="w-4 h-4" /> Config</button>
                           <div className="my-2 border-t border-[var(--border)] mx-4"></div>
                           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-all"><LogOut className="w-4 h-4" /> Logout</button>
                        </div>
                     </>
                  )}
               </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar scroll-smooth">
          <div className="max-w-6xl mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, onClick, isCollapsed }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <button onClick={() => { navigate(to); if (onClick) onClick(); }} className={clsx("w-full flex items-center gap-3 rounded-xl transition-all duration-300 group relative", isCollapsed ? "justify-center p-3.5" : "px-4 py-3.5", isActive ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]")}>
            {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/50"></div>}
            <span className={clsx(isActive ? "text-blue-500" : "group-hover:text-blue-500")}>{icon}</span>
            {!isCollapsed && <span className="font-bold text-sm tracking-wide">{label}</span>}
        </button>
    )
}
