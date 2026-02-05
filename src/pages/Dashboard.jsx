
import clsx from 'clsx';
import { Calendar, CheckCircle2, LayoutDashboard, List, Play, Plus, Search, ShieldAlert, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { StatsCard, TaskItem } from '../components/SharedComponents';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MOCK_TASKS_SETS, getSeededSet } from '../lib/guestMockData';

export default function Dashboard() {
  const { user, guestDataSeed } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, pending: 0, total: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const isGuest = user?.role === 'GUEST';

  // Guest Mock Data - Persistent for this session component mount
  const guestTasks = useMemo(() => isGuest ? getSeededSet(MOCK_TASKS_SETS, guestDataSeed) : [], [isGuest, guestDataSeed]);

  // New Task Form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState('PRACTICE');
  const [newTaskDuration, setNewTaskDuration] = useState(3600);
  const [assignedToEmail, setAssignedToEmail] = useState('');

  useEffect(() => {
    if (user?.role === 'ADMIN') setIsAdmin(true);
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); 
    return () => clearInterval(interval);
  }, [user]);

  const fetchDashboardData = async () => {
    if (isGuest) {
        setTasks(guestTasks);
        setStats({
            total: guestTasks.length,
            active: guestTasks.filter(t => t.status === 'IN_PROGRESS').length,
            completed: guestTasks.filter(t => t.status === 'COMPLETED').length,
            pending: guestTasks.filter(t => t.status === 'PENDING').length
        });
        return;
    }
    try {
      const [tasksRes, statsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/tasks/stats')
      ]);
      setTasks(tasksRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (isGuest) return toast.error("Guest Mode: Update restricted.");
    try {
        await api.post('/tasks', {
            title: newTaskTitle,
            description: newTaskDesc,
            type: newTaskType,
            duration: parseInt(newTaskDuration),
            assignedToEmail: isAdmin ? assignedToEmail : undefined
        });
        setShowCreateModal(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setAssignedToEmail('');
        fetchDashboardData();
    } catch (err) {
        toast.error('Failed to create task');
    }
  };

  const filteredTasks = tasks.filter(t => {
      if (filter === 'ALL') return true;
      return t.status === filter;
  });

  const handleRefresh = () => fetchDashboardData();
  
  const guardAction = (callback) => {
      if (isGuest) {
          toast.error("Guest Mode: Action restricted.");
          return;
      }
      callback();
  };

  const handleStart = (id) => guardAction(async () => { await api.patch(`/tasks/${id}/start`); handleRefresh(); });
  const handleComplete = (id) => guardAction(async () => { await api.patch(`/tasks/${id}/complete`); handleRefresh(); });
  const handleStop = (id) => guardAction(async () => { await api.patch(`/tasks/${id}/stop`); handleRefresh(); });
  const handleDelete = (id) => guardAction(async () => { if(confirm('Delete?')) { await api.delete(`/tasks/${id}`); handleRefresh(); }});
  const handleAssign = (id) => guardAction(async () => { await api.patch(`/tasks/${id}/assign`); handleRefresh(); });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-bold tracking-widest uppercase">Tasks</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
             Dashboard
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-lg">
             {isGuest ? "Viewing demo tasks as a guest." : "Manage your daily tasks efficiently."}
          </p>
        </div>
        
        {isAdmin && !isGuest && (
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="premium-gradient text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Task</span>
                </button>
            </div>
        )}

        {isGuest && (
            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2 text-blue-400">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Guest Mode</span>
            </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<List className="w-6 h-6" />} label="Total Tasks" value={stats.total} subValue="+12% from last week" color="blue" />
        <StatsCard icon={<Play className="w-6 h-6" />} label="Active Now" value={stats.active} subValue="3 tasks due soon" color="emerald" />
        <StatsCard icon={<CheckCircle2 className="w-6 h-6" />} label="Completed" value={stats.completed} subValue="98% completion rate" color="emerald" />
        <StatsCard icon={<Calendar className="w-6 h-6" />} label="Pending" value={stats.pending} subValue="Requires attention" color="blue" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--card)]/50 p-2 rounded-2xl border border-[var(--border)]">
          <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  className="w-full sm:w-64 bg-[var(--background)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={clsx(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                        filter === f 
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
                            : "text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
                    )}
                  >
                      {f.replace('_', ' ')}
                  </button>
              ))}
              <button className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] rounded-lg transition-colors">
                  <SlidersHorizontal className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Recent Activity</h2>
          </div>
          
          <div className="glass-card overflow-hidden min-h-[300px]">
             {filteredTasks.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                     <div className="w-24 h-24 bg-[var(--card)] rounded-full flex items-center justify-center mb-4 border border-[var(--border)]">
                         <List className="w-10 h-10 text-[var(--muted)]" />
                     </div>
                     <p className="text-[var(--muted)] font-medium">No tasks found for this filter.</p>
                 </div>
             ) : (
                 <div className="divide-y divide-[var(--border)]">
                     {filteredTasks.map(task => (
                         <TaskItem key={task.id} task={task} isAdmin={isAdmin} onStart={handleStart} onComplete={handleComplete} onStop={handleStop} onDelete={handleDelete} onAssign={handleAssign} />
                     ))}
                 </div>
             )}
          </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && !isGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--foreground)]/[0.02]">
                      <h3 className="font-bold text-lg text-[var(--foreground)]">Create New Task</h3>
                      <button onClick={() => setShowCreateModal(false)} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                          <Trash2 className="w-5 h-5" /> 
                      </button>
                  </div>
                  <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Title</label>
                          <input 
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Description</label>
                          <textarea 
                              value={newTaskDesc}
                              onChange={e => setNewTaskDesc(e.target.value)}
                              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px]"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Type</label>
                              <select 
                                  value={newTaskType}
                                  onChange={e => setNewTaskType(e.target.value)}
                                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              >
                                  <option value="PRACTICE">Practice</option>
                                  <option value="EXAM">Exam</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Duration (seconds)</label>
                              <input 
                                  type="number"
                                  value={newTaskDuration}
                                  onChange={e => setNewTaskDuration(e.target.value)}
                                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                          </div>
                      </div>
                      
                      {isAdmin && (
                          <div>
                              <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Assign User (Email)</label>
                              <input 
                                  value={assignedToEmail}
                                  onChange={e => setAssignedToEmail(e.target.value)}
                                  placeholder="user@example.com"
                                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                          </div>
                      )}

                      <div className="pt-4 flex justify-end gap-3">
                          <button 
                              type="button" 
                              onClick={() => setShowCreateModal(false)}
                              className="px-4 py-2 rounded-lg text-sm font-bold text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                          >
                              Create Task
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
