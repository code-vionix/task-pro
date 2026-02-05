
import clsx from 'clsx';
import { CheckCircle2, Mail, Shield, Trash2, XCircle } from 'lucide-react';

/**
 * Reusable toggle button for user permissions.
 */
function PermissionToggle({ label, active, onClick }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
            <div className={clsx(
                "p-2.5 rounded-xl border transition-all duration-300 shadow-sm",
                active 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 scale-100" 
                    : "bg-rose-500/10 border-rose-500/30 text-rose-500 opacity-60 group-hover:opacity-100"
            )}>
                {active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">{label}</span>
        </button>
    );
}

/**
 * UserManagementTable displays the list of users with granular permission controls.
 */
export default function UserManagementTable({ users, onTogglePermission, onToggleRole, onDeleteUser }) {
  return (
    <div className="glass-card overflow-x-auto shadow-2xl border-[var(--border)]">
      <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--foreground)]/[0.03]">
                  <th className="p-5 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Agent Identity</th>
                  <th className="p-5 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] text-center">Operational Access</th>
                  <th className="p-5 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] text-center">Protocol Level</th>
                  <th className="p-5 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] text-right">Termination</th>
              </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
              {users.map((u) => (
                  <tr key={u.id} className="group hover:bg-[var(--foreground)]/[0.02] transition-colors">
                      <td className="p-5">
                          <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 via-[var(--card)] to-purple-500/10 flex items-center justify-center border border-[var(--border)] text-blue-500 font-bold text-xl shadow-inner transform group-hover:rotate-3 transition-transform">
                                  {u.avatarUrl ? (
                                      <img src={u.avatarUrl} className="w-full h-full object-cover rounded-2xl" />
                                  ) : (u.name?.[0]?.toUpperCase() || u.email[0]?.toUpperCase())}
                              </div>
                              <div>
                                  <div className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase italic tracking-tight text-base">
                                      {u.name || 'Anonymous Agent'}
                                      {u.role === 'ADMIN' && <Shield className="w-4 h-4 text-indigo-500" />}
                                  </div>
                                  <div className="text-[11px] text-[var(--muted)] flex items-center gap-2 font-black uppercase tracking-widest opacity-60">
                                      <Mail className="w-3.5 h-3.5" /> {u.email}
                                  </div>
                              </div>
                          </div>
                      </td>
                      <td className="p-5">
                          <div className="flex items-center justify-center gap-6">
                              <PermissionToggle label="Post" active={u.canPost} onClick={() => onTogglePermission(u.id, 'canPost', u.canPost)} />
                              <PermissionToggle label="Chat" active={u.canMessage} onClick={() => onTogglePermission(u.id, 'canMessage', u.canMessage)} />
                              <PermissionToggle label="Social" active={u.canUseCommunity} onClick={() => onTogglePermission(u.id, 'canUseCommunity', u.canUseCommunity)} />
                              <PermissionToggle label="Task" active={u.canCreateTask} onClick={() => onTogglePermission(u.id, 'canCreateTask', u.canCreateTask)} />
                          </div>
                      </td>
                      <td className="p-5 text-center">
                          <button 
                            onClick={() => onToggleRole(u.id, u.role)}
                            className={clsx(
                              "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-sm hover:-translate-y-0.5 active:scale-95",
                              u.role === 'ADMIN' 
                                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-500/10" 
                                : u.role === 'ASSISTANT_ADMIN'
                                ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-purple-500/10"
                                : "bg-slate-500/10 border-slate-500/30 text-slate-500 shadow-slate-500/10"
                            )}
                          >
                              {u.role.replace('_', ' ')}
                          </button>
                      </td>
                      <td className="p-5 text-right">
                           <button 
                            onClick={() => onDeleteUser(u.id)}
                            className="p-3 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-90"
                           >
                               <Trash2 className="w-5 h-5" />
                           </button>
                      </td>
                  </tr>
              ))}
          </tbody>
      </table>
    </div>
  );
}
