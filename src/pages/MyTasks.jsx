import clsx from 'clsx';
import { Calendar, LayoutDashboard, List, Search, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { TaskItem } from '../components/SharedComponents';
import CalendarView from '../components/task/CalendarView';
import api from '../lib/api';
import { MOCK_TASKS_SETS, getSeededSet } from '../lib/guestMockData';
import { setTasks } from '../store/slices/taskSlice';

/**
 * MyTasks Page
 * Displays a list of tasks assigned to the current user.
 * Integrated with Redux for state management and real-time refreshes.
 */
export default function MyTasks() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { items: tasks } = useSelector(state => state.tasks);
  const [view, setView] = useState('LIST');
  
  const isGuest = user?.role === 'GUEST';
  const guestDataSeed = 0; // Can be pulled from context if needed
  const guestTasks = useMemo(() => isGuest ? getSeededSet(MOCK_TASKS_SETS, guestDataSeed) : [], [isGuest, guestDataSeed]);

  useEffect(() => {
    fetchTasks();
    if (!isGuest) {
        const interval = setInterval(fetchTasks, 15000); 
        return () => clearInterval(interval);
    }
  }, [isGuest]);

  const fetchTasks = async () => {
    if (isGuest) {
        dispatch(setTasks(guestTasks));
        return;
    }
    try {
      const res = await api.get('/tasks');
      dispatch(setTasks(res.data));
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const guardAction = (callback) => {
      if (isGuest) {
          toast.error("Guest Mode: Access Denied.");
          return;
      }
      callback();
  };

  const handleRefresh = () => fetchTasks();

  const handleStart = (id) => guardAction(async () => {
      try {
          await api.patch(`/tasks/${id}/start`);
          handleRefresh();
      } catch (e) { toast.error('Failed to start task'); }
  });

  const handleComplete = (id, notes) => guardAction(async () => {
      try {
          await api.patch(`/tasks/${id}/complete`, { submissionNotes: notes });
          handleRefresh();
          toast.success("Broadcast transmitted for review");
      } catch (e) { toast.error(e.response?.data?.message || 'Transmission failed'); }
  });

  const handleApprove = (id) => guardAction(async () => {
    try {
        await api.patch(`/tasks/${id}/approve`);
        handleRefresh();
        toast.success("Signal authenticated");
    } catch (e) { toast.error('Approval failed'); }
  });

  const handleReject = (id, reason) => guardAction(async () => {
    try {
        await api.patch(`/tasks/${id}/reject`, { reason });
        handleRefresh();
        toast.success("Signal rejected");
    } catch (e) { toast.error('Rejection failed'); }
  });

  const handleStop = (id) => guardAction(async () => {
    try {
        await api.patch(`/tasks/${id}/stop`);
        handleRefresh();
    } catch (e) { toast.error('Failed to stop task'); }
  });

  const handleDelete = (id) => guardAction(async () => {
    if (!confirm('Execute deletion protocol?')) return;
    try {
        await api.delete(`/tasks/${id}`);
        handleRefresh();
    } catch (e) { toast.error('Elimination failed'); }
  });

  const handleAssign = (id) => guardAction(async () => {
      try {
          await api.patch(`/tasks/${id}/assign`);
          handleRefresh();
      } catch (e) { toast.error('Assignment failed'); }
  });

  const handleToggleSubTask = (id) => guardAction(async () => {
    try {
        await api.patch(`/tasks/subtasks/${id}/toggle`);
        handleRefresh();
    } catch (e) { toast.error('Toggle failed'); }
  });

  const handleToggleSubSubTask = (id) => guardAction(async () => {
    try {
        await api.patch(`/tasks/subsubtasks/${id}/toggle`);
        handleRefresh();
    } catch (e) { toast.error('Toggle failed'); }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest uppercase">My Assignment</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tighter uppercase italic">
             Mission <span className="text-blue-500">Log</span>
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-lg text-sm font-medium">
             {isGuest ? "Observing simulated task environment." : "Execute and track your allocated operational duties."}
          </p>
        </div>
        {isGuest && (
            <div className="px-5 py-2.5 border border-amber-500/20 bg-amber-500/5 rounded-2xl text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse">
                <ShieldAlert className="w-5 h-5" />
                Guest Mode: Read Only
            </div>
        )}
      </header>

      {/* Control Bar */}
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-black text-[var(--foreground)] tracking-tight uppercase italic underline decoration-blue-500 decoration-2 underline-offset-8 whitespace-nowrap">
              Active Signals ({tasks.length})
            </h2>
            
            <div className="flex bg-[var(--card)]/50 p-1 rounded-xl border border-[var(--border)]">
               <button 
                 onClick={() => setView('LIST')}
                 className={clsx("p-2 rounded-lg transition-all", view === 'LIST' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-[var(--muted)] hover:text-blue-500")}
               >
                 <List className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setView('CALENDAR')}
                 className={clsx("p-2 rounded-lg transition-all", view === 'CALENDAR' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-[var(--muted)] hover:text-blue-500")}
               >
                 <Calendar className="w-4 h-4" />
               </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter tasks..." 
              className="w-full bg-[var(--card)]/50 border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>
      </div>

      {/* Task Repository */}
      {view === 'LIST' ? (
        <div className="glass-card overflow-hidden bg-[var(--card)]/20 shadow-2xl transition-all duration-500">
          {tasks.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-3xl bg-[var(--card)] flex items-center justify-center mb-6 border border-[var(--border)] shadow-inner transform rotate-12">
                  <LayoutDashboard className="w-10 h-10 text-[var(--muted)]" />
              </div>
              <h3 className="text-xl font-black text-[var(--foreground)] mb-2 uppercase tracking-tight italic">No signals identified</h3>
              <p className="text-[var(--muted)] text-xs font-bold uppercase tracking-widest">Waiting for next transmission...</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {tasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  isAdmin={user?.role === 'ADMIN'} 
                  onStart={handleStart} 
                  onComplete={handleComplete} 
                  onStop={handleStop} 
                  onDelete={handleDelete} 
                  onAssign={handleAssign} 
                  handleApprove={handleApprove}
                  handleReject={handleReject}
                  onToggleSubTask={handleToggleSubTask}
                  onToggleSubSubTask={handleToggleSubSubTask}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <CalendarView tasks={tasks} />
      )}
    </div>
  );
}
