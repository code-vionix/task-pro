import { AlertCircle, CheckCircle2, Clock, Filter, LayoutDashboard, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatsCard, TaskItem } from '../components/SharedComponents';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000); // Poll every 10s for updates
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

  const handleStart = async (id: string) => {
      try {
          await api.patch(`/tasks/${id}/start`);
          fetchTasks();
      } catch (e) {
          alert('Failed to start task');
      }
  };

  const handleComplete = async (id: string) => {
      try {
          await api.patch(`/tasks/${id}/complete`);
          fetchTasks();
      } catch (e: any) {
          alert(e.response?.data?.message || 'Failed to complete task');
      }
  };

  const handleStop = async (id: string) => {
    try {
        await api.patch(`/tasks/${id}/stop`);
        fetchTasks();
    } catch (e) {
        alert('Failed to stop task');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
        await api.delete(`/tasks/${id}`);
        fetchTasks();
    } catch (e) {
        alert('Failed to delete task');
    }
  };

  const handleAssign = async (id: string) => {
    try {
        await api.patch(`/tasks/${id}/assign`);
        fetchTasks();
    } catch (e: any) {
        alert(e.response?.data?.message || 'Failed to assign task');
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        isAdmin={user?.role === 'ADMIN'}
        onSuccess={fetchTasks}
      />
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-bold tracking-widest uppercase">Overview</span>
          </div>
          <h1 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
            Welcome, {user?.role === 'ADMIN' ? 'Administrator' : user?.email.split('@')[0] || 'User'}
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-lg">
            Manage your project tasks and monitor system performance from your central command center.
          </p>
        </div>
        {user?.role === 'ADMIN' && (
            <button onClick={() => setIsModalOpen(true)} className="premium-gradient text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95 group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Create New Task</span>
            </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard icon={<Clock className="w-12 h-12 text-blue-500" />} label="Total Tasks" value={tasks.length} subValue="+12% from last week" color="blue" />
        <StatsCard icon={<CheckCircle2 className="w-12 h-12 text-emerald-500" />} label="Active Projects" value={tasks.filter(t => t.status === 'IN_PROGRESS').length} color="emerald" />
        <StatsCard icon={<AlertCircle className="w-12 h-12 text-rose-500" />} label="Paused/Stopped" value={tasks.filter(t => t.isStopped).length} color="rose" />
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Recent Activity</h2>
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

        <div className="glass-card overflow-hidden">
          {tasks.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-full bg-[var(--card)] flex items-center justify-center mb-6">
                 <LayoutDashboard className="w-10 h-10 text-[var(--muted)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No tasks available</h3>
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
    </div>
  );
}

function CreateTaskModal({ isOpen, onClose, isAdmin, onSuccess }: any) {
    if (!isOpen) return null;
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('5');
    const [assignedToEmail, setAssignedToEmail] = useState('');
    const [type, setType] = useState('PRACTICE');

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/tasks', { 
                title, 
                description, 
                duration: parseInt(duration), 
                type,
                assignedToEmail: isAdmin ? assignedToEmail : undefined 
            });
            onSuccess();
            onClose();
            setTitle(''); setDescription('');
        } catch (err) {
            alert('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]"><Plus className="w-6 h-6 rotate-45" /></button>
                <h3 className="text-2xl font-bold text-[var(--foreground)] mb-6">Create New Task</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Title</label>
                        <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--muted)] mb-1">Duration (mins)</label>
                            <input type="number" min="1" required value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        <div>
                             <label className="block text-sm text-[var(--muted)] mb-1">Type</label>
                             <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                 <option value="PRACTICE" className="text-slate-900">Practice</option>
                                 <option value="EXAM" className="text-slate-900">Exam</option>
                             </select>
                        </div>
                    </div>
                    {isAdmin && (
                        <div>
                            <label className="block text-sm text-[var(--muted)] mb-1">Assign To (Email)</label>
                            <input value={assignedToEmail} onChange={e => setAssignedToEmail(e.target.value)} placeholder="Leave empty for Open Task" className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                            <p className="text-[10px] text-[var(--muted)] mt-1">If left empty, any user can see and claim this task.</p>
                        </div>
                    )}
                    <button disabled={loading} className="w-full premium-gradient text-white py-3 rounded-xl font-bold mt-4 hover:opacity-90 disabled:opacity-50">
                        {loading ? 'Creating...' : 'Create Task'}
                    </button>
                </form>
            </div>
        </div>
    );
}
