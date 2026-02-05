
import clsx from 'clsx';
import { MessageSquareMore, Search, Shield, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import CommunicationSurveillance from '../components/admin/CommunicationSurveillance';
import UserManagementTable from '../components/admin/UserManagementTable';
import api from '../lib/api';

/**
 * System Control Page
 * Central hub for administrators to manage users, monitor communications, and maintain site integrity.
 * Refactored into a modular structure for maximum clarity and scalability.
 */
export default function SystemControl() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('USERS'); 
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [adminMessages, setAdminMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      toast.error("Resource acquisition failed: Users");
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/admin/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch admin conversations', err);
    }
  };

  const handleFetchConversation = async (u1, u2) => {
    try {
      const res = await api.get(`/messages/admin/conversation/${u1}/${u2}`);
      setAdminMessages(res.data);
      setSelectedConversation({ u1, u2 });
    } catch (err) {
      toast.error("Decryption failed: Channel access denied");
    }
  };

  const handleTogglePermission = async (userId, field, currentVal) => {
    try {
      await api.patch(`/users/${userId}/permissions`, { [field]: !currentVal });
      toast.success("Protocol updated");
      fetchUsers();
    } catch (err) {
      toast.error("Permission override failed");
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const roles = ['USER', 'ASSISTANT_ADMIN', 'ADMIN'];
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
    
    try {
      await api.patch(`/users/${userId}/permissions`, { role: nextRole });
      toast.success(`Entity promoted to ${nextRole}`);
      fetchUsers();
    } catch (err) {
      toast.error("Clearance upgrade failed");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Execute termination protocol? This action is irreversible.")) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success("Entity removed from grid");
      fetchUsers();
    } catch (err) {
      toast.error("Termination aborted: System error");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Erase signal from logs?")) return;
    try {
      await api.delete(`/messages/${messageId}`);
      toast.success("Signal purged");
      if (selectedConversation) {
        handleFetchConversation(selectedConversation.u1, selectedConversation.u2);
      }
    } catch (err) {
      toast.error("Purge failed");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      {/* 1. Dashboard Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <Shield className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black tracking-[0.3em] uppercase italic">Command Center</span>
          </div>
          <h1 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tighter uppercase italic">
             System <span className="text-blue-500">Grid</span>
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-lg text-sm font-medium">
             Centralized intelligence and authority console for platform-wide operations.
          </p>
        </div>

        {/* Tab Switcher */}
        <nav className="flex bg-[var(--card)]/50 p-1.5 rounded-2xl border border-[var(--border)] shadow-inner">
            <button 
                onClick={() => setActiveTab('USERS')}
                className={clsx(
                    "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3",
                    activeTab === 'USERS' 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
            >
                <UserCheck className="w-4 h-4" /> Personnel
            </button>
            <button 
                onClick={() => setActiveTab('COMMUNICATIONS')}
                className={clsx(
                    "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3",
                    activeTab === 'COMMUNICATIONS' 
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
            >
                <MessageSquareMore className="w-4 h-4" /> Neural Logs
            </button>
        </nav>
      </header>

      {/* 2. Main Module Interface */}
      {activeTab === 'USERS' ? (
        <section className="space-y-6 animate-in slide-in-from-left-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">
                  Verified Entities ({users.length})
                </h2>
                <div className="relative w-full sm:w-80 group">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Scan user signatures..." 
                      className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-12 pr-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all shadow-inner"
                    />
                </div>
            </div>

            <UserManagementTable 
                users={filteredUsers}
                onTogglePermission={handleTogglePermission}
                onToggleRole={handleToggleRole}
                onDeleteUser={handleDeleteUser}
            />
        </section>
      ) : (
        <section className="animate-in slide-in-from-right-4 duration-500">
            <CommunicationSurveillance 
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={handleFetchConversation}
                adminMessages={adminMessages}
                onDeleteMessage={handleDeleteMessage}
            />
        </section>
      )}
    </div>
  );
}
