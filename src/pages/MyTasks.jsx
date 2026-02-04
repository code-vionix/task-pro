
import { Filter, LayoutDashboard, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TaskItem } from '../components/SharedComponents';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000); 
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStart = async (id) => {
      try {
          await api.patch(`/tasks/${id}/start`);
          fetchTasks();
      } catch (e) {
          alert('Failed to start task');
      }
  };

  const handleComplete = async (id) => {
      try {
          await api.patch(`/tasks/${id}/complete`);
          fetchTasks();
      } catch (e) {
          alert('Failed to complete task');
      }
  };

  const handleStop = async (id) => {
    try {
        await api.patch(`/tasks/${id}/stop`);
        fetchTasks();
    } catch (e) {
        alert('Failed to stop task');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
        await api.delete(`/tasks/${id}`);
        fetchTasks();
    } catch (e) {
        alert('Failed to delete task');
    }
  };

  const handleAssign = async (id) => {
      try {
          await api.patch(`/tasks/${id}/assign`);
          fetchTasks();
      } catch (e) {
          alert('Failed to assign task');
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-bold tracking-widest uppercase">Workspace</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
             My Tasks
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-lg">
             View and manage all your assigned tasks.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
       <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">All Tasks ({tasks.length})</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-64"
              />
            </div>
            <button className="p-2 glass rounded-lg hover:bg-[var(--card-hover)] transition-colors">
              <Filter className="w-4 h-4 text-[var(--muted)]" />
            </button>
          </div>
      </div>

      {/* Task List */}
      <div className="glass-card overflow-hidden">
        {tasks.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[var(--card)] flex items-center justify-center mb-6">
                <LayoutDashboard className="w-10 h-10 text-[var(--muted)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No tasks found</h3>
            <p className="text-[var(--muted)]">You don't have any tasks assigned yet.</p>
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
