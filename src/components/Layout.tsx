import clsx from 'clsx';
import { Bell, ChevronRight, Globe, Home, List, LogOut, MessageSquare, Moon, Settings, Shield, Sun, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  const handleNotificationClick = async (notif: any) => {
      // Mark as read
      if (!notif.isRead) {
          await api.patch(`/notifications/${notif.id}/read`);
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      }
      setShowNotifications(false);

      // Redirect based on type
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
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-72 glass border-r border-[var(--border)] flex flex-col z-20">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--foreground)] tracking-tight uppercase italic leading-none">
                Task<span className="text-blue-500">Pro</span>
              </h1>
              <span className="text-[10px] font-bold text-[var(--muted)] tracking-[0.2em] uppercase">Enterprise</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 mt-4 text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">General</div>
          <NavItem to="/" icon={<Home className="w-5 h-5"/>} label="Dashboard" />
          <NavItem to="/tasks" icon={<List className="w-5 h-5"/>} label="My Tasks" />
          <NavItem to="/community" icon={<Globe className="w-5 h-5"/>} label="Community" />
          <NavItem to="/chat" icon={<MessageSquare className="w-5 h-5"/>} label="Secure Chat" />
          <NavItem to="/profile" icon={<User className="w-5 h-5"/>} label="My Profile" />
          
          {user?.role === 'ADMIN' && (
            <>
              <div className="px-4 py-2 mt-6 text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Administration</div>
              <NavItem to="/admin" icon={<Shield className="w-5 h-5"/>} label="System Control" />
              <NavItem to="/settings" icon={<Settings className="w-5 h-5"/>} label="Configuration" />
            </>
          )}
        </nav>

        <div className="p-6 mt-auto border-t border-[var(--border)]">
          <div className="glass-card p-4 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
               {user?.avatarUrl ? (
                 <img 
                    src={user.avatarUrl} 
                    className="w-full h-full object-cover" 
                    style={{ objectPosition: user.avatarPosition ? `${user.avatarPosition.x}% ${user.avatarPosition.y}%` : 'center' }}
                 />
               ) : (
                 <span className="text-sm font-bold text-white">{user?.email[0].toUpperCase()}</span>
               )}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-[var(--foreground)] truncate px-0">{user?.email.split('@')[0]}</p>
               <p className="text-[10px] text-[var(--muted)] truncate lowercase">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-[var(--foreground)] hover:bg-white/5 rounded-xl transition-all border border-[var(--border)] mb-2 group"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500 group-hover:rotate-45 transition-transform" /> : <Moon className="w-4 h-4 text-blue-500 group-hover:-rotate-12 transition-transform" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 shadow-lg shadow-rose-500/0 hover:shadow-rose-500/5 group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-20 border-b border-[var(--border)] px-8 flex items-center justify-between z-10 backdrop-blur-sm bg-[var(--background)]/50">
           <div className="flex items-center gap-2 text-[var(--muted)] text-sm">
             <span className="font-medium uppercase tracking-widest text-[10px]">System</span>
             <ChevronRight className="w-4 h-4 opacity-50" />
             <span className="text-[var(--foreground)] font-bold">{useLocation().pathname === '/' ? 'Dashboard' : 'Navigation'}</span>
           </div>
           <div className="flex items-center gap-4">
               <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)} 
                    className={clsx(
                        "p-2.5 glass-card rounded-xl transition-all relative group",
                        showNotifications ? "bg-white/10 text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                   >
                      <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-[var(--background)] flex items-center justify-center text-[8px] font-black text-white">
                            {unreadCount}
                        </span>
                      )}
                   </button>

                   {showNotifications && (
                      <div className="absolute right-0 mt-4 w-80 glass-card bg-[var(--background)]/95 border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-white/[0.02]">
                              <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest">Notifications</h3>
                              {unreadCount > 0 && (
                                  <button onClick={markAllAsRead} className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-tight">Mark all read</button>
                              )}
                          </div>
                          <div className="max-h-96 overflow-y-auto custom-scrollbar">
                              {notifications.length === 0 ? (
                                  <div className="p-10 text-center text-[var(--muted)] text-xs italic">No transmissions found</div>
                              ) : (
                                  <div className="divide-y divide-[var(--border)]">
                                      {notifications.map((n) => (
                                          <button 
                                              key={n.id}
                                              onClick={() => handleNotificationClick(n)}
                                              className={clsx(
                                                "w-full p-4 text-left hover:bg-white/5 transition-colors flex gap-3",
                                                !n.isRead && "bg-blue-600/[0.03]"
                                              )}
                                          >
                                              <div className={clsx(
                                                  "w-2 h-2 rounded-full shrink-0 mt-1.5",
                                                  !n.isRead ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-700"
                                              )}></div>
                                              <div>
                                                  <p className={clsx("text-xs leading-relaxed", !n.isRead ? "text-[var(--foreground)] font-medium" : "text-[var(--muted)]")}>{n.message}</p>
                                                  <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-tighter mt-1">
                                                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {n.type}
                                                  </p>
                                              </div>
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                   )}
               </div>
              <div className="h-6 w-px bg-[var(--border)] mx-2"></div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--muted)] hidden sm:block uppercase tracking-widest">UPTIME: 99.9%</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === to;
    
    return (
        <button
            onClick={() => navigate(to)}
            className={clsx(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-blue-600/10 text-[var(--foreground)] border border-blue-500/20" 
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5 border border-transparent"
            )}
        >
            {isActive && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            )}
            <span className={clsx("transition-all duration-300", isActive ? "text-blue-500 scale-110" : "group-hover:scale-110")}>
                {icon}
            </span>
            <span className={clsx("font-bold text-sm tracking-wide", isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100")}>
              {label}
            </span>
            {!isActive && (
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-40 transition-all group-hover:translate-x-1" />
            )}
        </button>
    )
}
