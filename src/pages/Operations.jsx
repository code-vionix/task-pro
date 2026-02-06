
import clsx from 'clsx';
import { CheckCircle2, Search, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { TaskItem } from '../components/SharedComponents';
import api from '../lib/api';

export default function Operations() {
  const { user } = useSelector(state => state.auth);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('UNDER_REVIEW');
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      let filtered = res.data;
      if (filter !== 'ALL') {
        filtered = res.data.filter(t => t.status === filter);
      }
      setTasks(filtered);
    } catch (err) {
      toast.error('Failed to intercept signals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/tasks/${id}/approve`);
      toast.success("Signal Authenticated");
      fetchTasks();
    } catch (e) { toast.error('Approval failed'); }
  };

  const handleReject = async (id, reason) => {
    try {
      await api.patch(`/tasks/${id}/reject`, { reason });
      toast.success("Signal Rejected");
      fetchTasks();
    } catch (e) { toast.error('Rejection failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Execute deletion?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (e) { toast.error('Elimination failed'); }
  };

  if (!isAdmin) return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <ShieldAlert className="w-20 h-20 text-rose-500 mb-6 animate-pulse" />
        <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tighter">Access Denied</h2>
        <p className="text-[var(--muted)] text-sm font-black uppercase tracking-widest mt-2 italic">Requires Admin Clearance to monitor field operations.</p>
     </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-black tracking-widest uppercase">Operations Command</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tighter uppercase italic">
             Mission <span className="text-rose-600">Control</span>
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-lg text-sm font-medium uppercase tracking-tight italic">
             Monitor task authentication requests and field agent activity.
          </p>
        </div>
      </header>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--card)]/50 p-4 rounded-2xl border border-[var(--border)]">
         <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {['ALL', 'UNDER_REVIEW', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((f) => (
               <button 
                 key={f} 
                 onClick={() => setFilter(f)} 
                 className={clsx("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", 
                    filter === f ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-blue-500"
                 )}
               >
                 {f.replace('_', ' ')}
               </button>
            ))}
         </div>
         <div className="relative w-full sm:w-64 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-blue-500" />
            <input type="text" placeholder="Trace signals..." className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--foreground)] focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
         </div>
      </div>

      {loading ? (
        <div className="space-y-4">
           {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[var(--card)]/50 rounded-2xl animate-pulse border border-[var(--border)]" />)}
        </div>
      ) : (
        <div className="glass-card overflow-hidden bg-[var(--card)]/20 shadow-2xl">
          {tasks.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center px-4">
               <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6 opacity-20" />
               <h3 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight italic">Clear Horizon</h3>
               <p className="text-[var(--muted)] text-xs font-black uppercase tracking-widest">No pending missions in this sector.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {tasks.map(task => (
                <div key={task.id} className="relative">
                   <TaskItem 
                     task={task} 
                     isAdmin={true} 
                     onDelete={handleDelete}
                     handleApprove={handleApprove}
                     handleReject={handleReject}
                   />
                   {task.status === 'UNDER_REVIEW' && (
                       <div className="px-16 pb-6 pt-0 animate-in slide-in-from-top-4 duration-500">
                          <div className="bg-blue-600/5 border border-blue-600/20 rounded-2xl p-6">
                             <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3 flex items-center gap-2">
                                <ShieldAlert className="w-3 h-3" /> Field Agent Report
                             </h5>
                             <p className="text-sm font-medium text-[var(--foreground)] italic leading-relaxed">
                                "{task.submissionNotes || "No notes provided by agent."}"
                             </p>
                          </div>
                       </div>
                   )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
