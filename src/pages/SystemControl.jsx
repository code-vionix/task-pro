
import clsx from 'clsx';
import { CheckCircle2, Mail, MessageSquare, MessageSquareMore, Search, Shield, Trash2, UserCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function SystemControl() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('USERS'); // USERS, COMMUNICATIONS
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [adminMessages, setAdminMessages] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  const fetchConversations = async () => {
      try {
          const res = await api.get('/messages/admin/conversations');
          setConversations(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  const fetchAdminConversation = async (u1, u2) => {
      try {
          const res = await api.get(`/messages/admin/conversation/${u1}/${u2}`);
          setAdminMessages(res.data);
          setSelectedConversation({ u1, u2 });
      } catch (err) {
          toast.error("Failed to fetch conversation content");
      }
  };

  const togglePermission = async (userId, field, currentVal) => {
      try {
          await api.patch(`/users/${userId}/permissions`, { [field]: !currentVal });
          toast.success("Permissions updated");
          fetchUsers();
      } catch (err) {
          toast.error("Failed to update permissions");
      }
  };

  const toggleRole = async (userId, currentRole) => {
      // Cycle: USER -> ASSISTANT_ADMIN -> ADMIN -> USER
      let newRole;
      if (currentRole === 'USER') {
          newRole = 'ASSISTANT_ADMIN';
      } else if (currentRole === 'ASSISTANT_ADMIN') {
          newRole = 'ADMIN';
      } else {
          newRole = 'USER';
      }
      
      try {
          await api.patch(`/users/${userId}/permissions`, { role: newRole });
          toast.success(`Role changed to ${newRole}`);
          fetchUsers();
      } catch (err) {
          toast.error("Failed to change role");
      }
  };

  const deleteUser = async (userId) => {
      if (!confirm("Are you sure? This will delete the user and all their data.")) return;
      try {
          await api.delete(`/users/${userId}`);
          toast.success("User deleted");
          fetchUsers();
      } catch (err) {
          toast.error("Failed to delete user");
      }
  };

  const deleteAnyPost = async (postId) => {
      try {
          await api.delete(`/posts/${postId}`);
          toast.success("Post deleted by Admin");
          // Optionally refresh something
      } catch (err) {
          toast.error("Delete failed");
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold tracking-widest uppercase">Administration</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
             System <span className="text-blue-500">Control</span>
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-lg">
             Super Admin interface for platform-wide authority and surveillance.
          </p>
        </div>

        <div className="flex bg-[var(--card)] p-1 rounded-2xl border border-[var(--border)]">
            <button 
                onClick={() => setActiveTab('USERS')}
                className={clsx(
                    "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                    activeTab === 'USERS' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
            >
                <UserCheck className="w-4 h-4" /> Users
            </button>
            <button 
                onClick={() => setActiveTab('COMMUNICATIONS')}
                className={clsx(
                    "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                    activeTab === 'COMMUNICATIONS' ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
            >
                <MessageSquareMore className="w-4 h-4" /> Communications
            </button>
        </div>
      </div>

      {activeTab === 'USERS' && (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Registered Entities ({users.length})</h2>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="bg-[var(--card)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-64"
                    />
                </div>
            </div>

            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--foreground)]/[0.02]">
                          <th className="p-4 text-xs font-bold text-[var(--muted)] uppercase tracking-widest">User Details</th>
                          <th className="p-4 text-xs font-bold text-[var(--muted)] uppercase tracking-widest text-center">Permissions</th>
                          <th className="p-4 text-xs font-bold text-[var(--muted)] uppercase tracking-widest text-center">Role</th>
                          <th className="p-4 text-xs font-bold text-[var(--muted)] uppercase tracking-widest text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                      {users.map((u) => (
                          <tr key={u.id} className="group hover:bg-[var(--foreground)]/[0.02] transition-colors">
                              <td className="p-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-[var(--border)] text-blue-500 font-black text-lg">
                                          {u.name?.[0]?.toUpperCase() || u.email[0]?.toUpperCase()}
                                      </div>
                                      <div>
                                          <div className="font-bold text-[var(--foreground)] flex items-center gap-2">
                                              {u.name || 'Anonymous'}
                                              {u.role === 'ADMIN' && <Shield className="w-3 h-3 text-indigo-400" />}
                                          </div>
                                          <div className="text-xs text-[var(--muted)] flex items-center gap-1 font-medium">
                                              <Mail className="w-3 h-3" /> {u.email}
                                          </div>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-4">
                                  <div className="flex items-center justify-center gap-4">
                                      <PermissionToggle label="Post" active={u.canPost} onClick={() => togglePermission(u.id, 'canPost', u.canPost)} />
                                      <PermissionToggle label="Chat" active={u.canMessage} onClick={() => togglePermission(u.id, 'canMessage', u.canMessage)} />
                                      <PermissionToggle label="Social" active={u.canUseCommunity} onClick={() => togglePermission(u.id, 'canUseCommunity', u.canUseCommunity)} />
                                      <PermissionToggle label="Task" active={u.canCreateTask} onClick={() => togglePermission(u.id, 'canCreateTask', u.canCreateTask)} />
                                  </div>
                              </td>
                              <td className="p-4 text-center">
                                  <button 
                                    onClick={() => toggleRole(u.id, u.role)}
                                    className={clsx(
                                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                      u.role === 'ADMIN' 
                                        ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                                        : u.role === 'ASSISTANT_ADMIN'
                                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                        : "bg-slate-500/10 border-slate-500/20 text-slate-500"
                                    )}
                                  >
                                      {u.role}
                                  </button>
                              </td>
                              <td className="p-4 text-right">
                                   <button 
                                    onClick={() => deleteUser(u.id)}
                                    className="p-2.5 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                   >
                                       <Trash2 className="w-5 h-5" />
                                   </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        </>
      )}

      {activeTab === 'COMMUNICATIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                  <h3 className="text-sm font-black text-[var(--muted)] uppercase tracking-widest px-2">Active Channels</h3>
                  <div className="glass-card divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto custom-scrollbar">
                      {conversations.length === 0 ? (
                           <div className="p-8 text-center text-[var(--muted)] italic text-sm">No recorded transmissions found.</div>
                      ) : (
                          conversations.map((conv, idx) => (
                              <button 
                                key={idx}
                                onClick={() => fetchAdminConversation(conv.user1.id, conv.user2.id)}
                                className={clsx(
                                    "w-full p-4 flex flex-col gap-2 hover:bg-[var(--card-hover)] transition-all text-left",
                                    selectedConversation?.u1 === conv.user1.id && selectedConversation?.u2 === conv.user2.id && "bg-purple-500/5 border-l-4 border-purple-500"
                                )}
                              >
                                  <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1 min-w-0">
                                          <span className="font-bold text-xs truncate text-[var(--foreground)]">{conv.user1.email.split('@')[0]}</span>
                                          <Shield className="w-2 h-2 text-[var(--muted)]" />
                                          <span className="font-bold text-xs truncate text-[var(--foreground)]">{conv.user2.email.split('@')[0]}</span>
                                      </div>
                                      <span className="text-[10px] text-[var(--muted)] shrink-0">{new Date(conv.lastMessageAt).toLocaleDateString()}</span>
                                  </div>
                              </button>
                          ))
                      )}
                  </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-black text-[var(--muted)] uppercase tracking-widest px-2">Transmission Log</h3>
                  <div className="glass-card min-h-[600px] flex flex-col">
                      {!selectedConversation ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                              <MessageSquare className="w-16 h-16 mb-4" />
                              <p className="font-black uppercase tracking-widest text-xs">Select a channel to decrypt</p>
                          </div>
                      ) : (
                          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                               {adminMessages.map((m, idx) => {
                                   const isUser1 = m.senderId === selectedConversation.u1;
                                   const prevMsg = idx > 0 ? adminMessages[idx - 1] : null;
                                   const showAvatar = !prevMsg || prevMsg.senderId !== m.senderId;
                                   
                                   return (
                                       <div key={m.id} className={clsx("flex gap-3", isUser1 ? "flex-row" : "flex-row-reverse")}>
                                           <div className="w-8 h-8 shrink-0 flex items-end">
                                               {showAvatar && (
                                                   <div className={clsx(
                                                       "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2",
                                                       isUser1 
                                                           ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                                                           : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                                                   )}>
                                                       {m.sender.email[0].toUpperCase()}
                                                   </div>
                                               )}
                                           </div>
                                           
                                           <div className={clsx("flex flex-col gap-1 max-w-[70%]", isUser1 ? "items-start" : "items-end")}>
                                               {showAvatar && (
                                                   <div className="flex items-center gap-2">
                                                       <span className={clsx(
                                                           "text-[10px] font-black uppercase",
                                                           isUser1 ? "text-blue-400" : "text-purple-400"
                                                       )}>
                                                           {m.sender.email.split('@')[0]}
                                                       </span>
                                                       <span className="text-[8px] font-mono text-[var(--muted)]">
                                                           {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                       </span>
                                                   </div>
                                               )}
                                               
                                               <div className={clsx(
                                                   "p-3 rounded-2xl text-sm font-medium relative group shadow-sm",
                                                   isUser1 
                                                       ? "bg-blue-500/10 border border-blue-500/20 text-[var(--foreground)] rounded-tl-sm" 
                                                       : "bg-purple-500/10 border border-purple-500/20 text-[var(--foreground)] rounded-tr-sm"
                                               )}>
                                                   {m.content}
                                                   <button 
                                                        onClick={async () => {
                                                            if (confirm("Erase message?")) {
                                                                await api.delete(`/messages/${m.id}`);
                                                                fetchAdminConversation(selectedConversation.u1, selectedConversation.u2);
                                                            }
                                                        }}
                                                        className="absolute -right-2 -top-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100"
                                                   >
                                                       <XCircle className="w-3 h-3" />
                                                   </button>
                                               </div>
                                           </div>
                                       </div>
                                   );
                               })}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

function PermissionToggle({ label, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className="flex flex-col items-center gap-1 group"
        >
            <div className={clsx(
                "p-2 rounded-xl border transition-all",
                active 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                    : "bg-rose-500/10 border-rose-500/20 text-rose-500 grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
            )}>
                {active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">{label}</span>
        </button>
    );
}
