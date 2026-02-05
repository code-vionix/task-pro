
import { LayoutDashboard, Search, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { TaskItem } from '../components/SharedComponents';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MOCK_TASKS_SETS, getSeededSet } from '../lib/guestMockData';

export default function MyTasks() {
  const { user, guestDataSeed } = useAuth();
  const [tasks, setTasks] = useState([]);
  const isGuest = user?.role === 'GUEST';
  const guestTasks = useMemo(() => isGuest ? getSeededSet(MOCK_TASKS_SETS, guestDataSeed) : [], [isGuest, guestDataSeed]);

  useEffect(() => {
    fetchTasks();
    if (!isGuest) {
        const interval = setInterval(fetchTasks, 10000); 
        return () => clearInterval(interval);
    }
  }, []);

  const fetchTasks = async () => {
    if (isGuest) {
        setTasks(guestTasks);
        return;
    }
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const guardAction = (callback) => {
      if (isGuest) {
          toast.error("Guest Mode: Action restricted.");
          return;
      }
      callback();
  };

  const handleStart = (id) => guardAction(async () => {
      try {
          await api.patch(`/tasks/${id}/start`);
          fetchTasks();
      } catch (e) {
          toast.error('Failed to start task');
      }
  });

  const handleComplete = (id) => guardAction(async () => {
      try {
          await api.patch(`/tasks/${id}/complete`);
          fetchTasks();
      } catch (e) {
          toast.error('Failed to complete task');
      }
  });

  const handleStop = (id) => guardAction(async () => {
    try {
        await api.patch(`/tasks/${id}/stop`);
        fetchTasks();
    } catch (e) {
        toast.error('Failed to stop task');
    }
  });

  const handleDelete = (id) => guardAction(async () => {
    if (!confirm('Are you sure?')) return;
    try {
        await api.delete(`/tasks/${id}`);
        fetchTasks();
    } catch (e) {
        toast.error('Failed to delete task');
    }
  });

  const handleAssign = (id) => guardAction(async () => {
      try {
          await api.patch(`/tasks/${id}/assign`);
          fetchTasks();
      } catch (e) {
          toast.error('Failed to assign task');
      }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-bold tracking-widest uppercase">Tasks</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight italic">
             My <span className="text-blue-500">Tasks</span>
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-lg">
             {isGuest ? "Viewing demo tasks as a guest." : "Manage your daily tasks efficiently."}
          </p>
        </div>
        {isGuest && (
            <div className="px-4 py-2 border border-amber-500/20 bg-amber-500/5 rounded-xl text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Guest Mode
            </div>
        )}
      </div>

      {/* Filter Bar */}
       <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Active Tasks ({tasks.length})</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-48 md:w-64"
              />
            </div>
          </div>
      </div>

      {/* Task List */}
      <div className="glass-card overflow-hidden">
        {tasks.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[var(--card)] flex items-center justify-center mb-6 border border-[var(--border)]">
                <LayoutDashboard className="w-10 h-10 text-[var(--muted)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2 uppercase tracking-tight">No Tasks Found</h3>
            <p className="text-[var(--muted)] text-sm">You don't have any tasks at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} isAdmin={user?.role === 'ADMIN'} onStart={handleStart} onComplete={handleComplete} onStop={handleStop} onDelete={handleDelete} onAssign={handleAssign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
