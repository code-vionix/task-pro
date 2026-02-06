import clsx from 'clsx';
import { AlertCircle, Calendar, CheckCircle2, LayoutDashboard, List, Play, Plus, Search, SlidersHorizontal, Trash2, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { StatsCard, TaskItem } from '../components/SharedComponents';
import api from '../lib/api';
import { MOCK_TASKS_SETS, getSeededSet } from '../lib/guestMockData';
import { setStats, setTasks } from '../store/slices/taskSlice';

/**
 * Dashboard Component Refactored to use Redux and smaller components.
 */
export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { items: tasks, stats } = useSelector(state => state.tasks);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Guest related data
  const guestDataSeed = 0; // Default or from somewhere else if needed
  const isGuest = user?.role === 'GUEST';
  const guestTasks = useMemo(() => isGuest ? getSeededSet(MOCK_TASKS_SETS, guestDataSeed) : [], [isGuest, guestDataSeed]);

  // Form states
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
        dispatch(setTasks(guestTasks));
        dispatch(setStats({
            total: guestTasks.length,
            active: guestTasks.filter(t => t.status === 'IN_PROGRESS').length,
            completed: guestTasks.filter(t => t.status === 'COMPLETED').length,
            pending: guestTasks.filter(t => t.status === 'PENDING').length
        }));
        return;
    }
    try {
      const [tasksRes, statsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/tasks/stats')
      ]);
      dispatch(setTasks(tasksRes.data));
      dispatch(setStats(statsRes.data));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  const handleCreateTask = async (e, extraData = {}) => {
    e.preventDefault();
    if (isGuest) return toast.error("Guest Mode: Restricted action.");
    try {
        await api.post('/tasks', {
            title: newTaskTitle,
            description: newTaskDesc,
            type: newTaskType,
            duration: parseInt(newTaskDuration),
            assignedToEmail: isAdmin ? assignedToEmail : undefined,
            ...extraData
        });
        setShowCreateModal(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setAssignedToEmail('');
        fetchDashboardData();
        toast.success("Mission Signal Created");
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

  const handleStart = (id) => guardAction(async () => { 
    try { await api.patch(`/tasks/${id}/start`); handleRefresh(); toast.success("Mission Initiated"); } 
    catch(e) { toast.error(e.response?.data?.message || "Start failed"); }
  });
  const handleComplete = (id, notes) => guardAction(async () => { 
    try { await api.patch(`/tasks/${id}/complete`, { submissionNotes: notes }); handleRefresh(); toast.success("Data Transmitted"); } 
    catch(e) { toast.error(e.response?.data?.message || "Transmission failed"); }
  });
  const handleStop = (id) => guardAction(async () => { 
    try { await api.patch(`/tasks/${id}/stop`); handleRefresh(); toast.success("Mission Paused"); } 
    catch(e) { toast.error(e.response?.data?.message || "Stop failed"); }
  });
  const handleDelete = (id) => guardAction(async () => { 
    if(confirm('Erase this signal forever?')) { 
        try { await api.delete(`/tasks/${id}`); handleRefresh(); toast.success("Signal Erased"); } 
        catch(e) { toast.error("Deletion failed"); }
    }
  });
  const handleAssign = (id) => guardAction(async () => { 
    try {
      await api.patch(`/tasks/${id}/assign`); 
      handleRefresh(); 
      toast.success("Signal Claimed");
    } catch (e) {
      toast.error(e.response?.data?.message || "Claim failed");
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <DashboardHeader 
        isGuest={isGuest} 
        isAdmin={isAdmin} 
        onNewTask={() => setShowCreateModal(true)} 
      />

      {(user && user.role === 'USER' && (user.category === null || user.category === undefined)) && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <AlertCircle className="w-6 h-6" />
             </div>
             <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-100 uppercase tracking-tight">Setup Required</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">You must select an Operation Category in your profile to claim signals.</p>
             </div>
          </div>
          <Link to="/profile" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">Setup Now</Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<List className="w-6 h-6" />} label="Total Tasks" value={stats.total} subValue="+12% from last week" color="blue" />
        <StatsCard icon={<Play className="w-6 h-6" />} label="Active Now" value={stats.active} subValue="3 tasks due soon" color="emerald" />
        <StatsCard icon={<CheckCircle2 className="w-6 h-6" />} label="Completed" value={stats.completed} subValue="98% completion rate" color="emerald" />
        <StatsCard icon={<Calendar className="w-6 h-6" />} label="Pending" value={stats.pending} subValue="Requires attention" color="blue" />
      </div>

      {/* Filter & Search */}
      <DashboardFilters filter={filter} setFilter={setFilter} />

      {/* Task List */}
      <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Recent Activity</h2>
          </div>
          <div className="glass-card overflow-hidden min-h-[300px]">
             {filteredTasks.length === 0 ? <EmptyState /> : (
                 <div className="divide-y divide-[var(--border)]">
                     {filteredTasks.map(task => (
                         <TaskItem key={task.id} task={task} isAdmin={isAdmin} onStart={handleStart} onComplete={handleComplete} onStop={handleStop} onDelete={handleDelete} onAssign={handleAssign} />
                     ))}
                 </div>
             )}
          </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
          <CreateTaskModal 
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTask}
            formData={{ newTaskTitle, setNewTaskTitle, newTaskDesc, setNewTaskDesc, newTaskType, setNewTaskType, newTaskDuration, setNewTaskDuration, assignedToEmail, setAssignedToEmail, isAdmin }}
          />
      )}
    </div>
  );
}

// Sub-components for Dashboard
function DashboardHeader({ isGuest, isAdmin, onNewTask }) {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
            <div>
                <div className="flex items-center gap-3 mb-2 text-blue-500">
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-xs font-bold tracking-widest uppercase">Overview</span>
                </div>
                <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Dashboard</h1>
                <p className="text-[var(--muted)] mt-2 max-w-lg">
                    {isGuest ? "Observing simulated task environment." : "Optimize your productivity with real-time tracking."}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/leaderboard')}
                  className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] px-4 py-3 rounded-xl font-bold hover:bg-[var(--card-hover)] transition-all flex items-center gap-2"
                >
                    <Trophy className="w-5 h-5 text-amber-500" /> Rankings
                </button>
                {isAdmin && !isGuest && (
                    <button onClick={onNewTask} className="premium-gradient text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center gap-2">
                        <Plus className="w-5 h-5" /> New Task
                    </button>
                )}
            </div>
        </div>
    );
}

function DashboardFilters({ filter, setFilter }) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--card)]/50 p-2 rounded-2xl border border-[var(--border)]">
            <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input type="text" placeholder="Search tasks..." className="w-full sm:w-64 bg-[var(--background)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={clsx("px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap", filter === f ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]")}>
                        {f.replace('_', ' ')}
                    </button>
                ))}
                <button className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] rounded-lg transition-colors"><SlidersHorizontal className="w-4 h-4" /></button>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-[var(--card)] rounded-3xl flex items-center justify-center mb-6 border border-[var(--border)] shadow-inner">
                <List className="w-10 h-10 text-[var(--muted)]" />
            </div>
            <p className="text-[var(--muted)] font-black uppercase tracking-[0.2em] text-[10px]">No active signals found</p>
        </div>
    );
}

function CreateTaskModal({ onClose, onSubmit, formData }) {
    const [priority, setPriority] = useState('MEDIUM');
    const [tags, setTags] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrence, setRecurrence] = useState('DAILY');

    const { newTaskTitle, setNewTaskTitle, newTaskDesc, setNewTaskDesc, newTaskType, setNewTaskType, newTaskDuration, setNewTaskDuration, assignedToEmail, setAssignedToEmail, isAdmin } = formData;
    
    const [category, setCategory] = useState('GENERAL');
    
    const augmentedSubmit = (e) => {
        e.preventDefault();
        const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
        onSubmit(e, { priority, tags: tagArray, isRecurring, recurrence, category });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--foreground)]/[0.02]">
                    <h3 className="font-bold text-lg text-[var(--foreground)]">Create Mission Signal</h3>
                    <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]"><Trash2 className="w-5 h-5" /></button>
                </div>
                <form onSubmit={augmentedSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-[10px] font-black text-[var(--muted)] uppercase mb-1">Title</label>
                        <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[var(--muted)] uppercase mb-1">Brief (Description)</label>
                        <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[80px]" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-[var(--muted)] uppercase mb-1">Type</label>
                            <select value={newTaskType} onChange={e => setNewTaskType(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase font-black text-xs">
                                <option value="PRACTICE">Practice</option>
                                <option value="EXAM">Exam</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-[var(--muted)] uppercase mb-1">Priority</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase font-black text-xs">
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-[var(--muted)] uppercase mb-1">Operation Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase font-black text-xs">
                            <option value="GENERAL">General</option>
                            <option value="WEB_DEV">Web Development</option>
                            <option value="SOCIAL_MEDIA">Social Media</option>
                            <option value="VIDEO_ENGAGEMENT">Video Engagement</option>
                            <option value="MARKETING">Marketing</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-[var(--muted)] uppercase mb-1">Signal Tags (Comma Separated)</label>
                        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="physics, logic, urgent" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-[var(--muted)] uppercase mb-1">Duration (Seconds)</label>
                            <input type="number" value={newTaskDuration} onChange={e => setNewTaskDuration(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        {isAdmin && (
                            <div>
                                <label className="block text-[10px] font-black text-[var(--muted)] uppercase mb-1">Agent Assignment (Email)</label>
                                <input value={assignedToEmail} onChange={e => setAssignedToEmail(e.target.value)} placeholder="agent@grid.com" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-[var(--card)]/50 border border-[var(--border)] rounded-xl flex items-center justify-between">
                         <div>
                            <div className="text-xs font-black uppercase text-[var(--foreground)]">Recurring Signal</div>
                            <p className="text-[10px] text-[var(--muted)]">Automate this transmission</p>
                         </div>
                         <div className="flex items-center gap-3">
                            {isRecurring && (
                               <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-1.5 text-[10px] font-black uppercase">
                                  <option value="DAILY">Daily</option>
                                  <option value="WEEKLY">Weekly</option>
                               </select>
                            )}
                            <button 
                              type="button"
                              onClick={() => setIsRecurring(!isRecurring)}
                              className={clsx("w-10 h-6 rounded-full transition-all relative", isRecurring ? "bg-blue-600" : "bg-[var(--border)]")}
                            >
                                <div className={clsx("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", isRecurring ? "right-1" : "left-1")} />
                            </button>
                         </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-black uppercase text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)] transition-colors">Abort</button>
                        <button type="submit" className="px-6 py-2 rounded-lg text-xs font-black uppercase text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">Create Signal</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
