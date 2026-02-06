
import clsx from 'clsx';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, FileText, LayoutDashboard, Link, Lock, MessageSquare, Paperclip, Play, Plus, Send, StopCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import SubmitTaskModal from '../components/task/SubmitTaskModal';
import TaskActivityMonitor from '../components/task/TaskActivityMonitor';
import { useAuth } from '../context/AuthContext';
import { useExtension } from '../context/ExtensionContext';
import { useTaskMonitor } from '../hooks/useTaskMonitor';
import api from '../lib/api';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { extensionInstalled } = useExtension();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);

  // Monitor for distractions
  useTaskMonitor(id, task?.status === 'IN_PROGRESS' && !task?.isStopped);

  useEffect(() => {
    if (task) {
        if (task.status === 'IN_PROGRESS' && !task.isStopped && task.duration > 0) {
            // Calculate remaining time appropriately?
            // For now, let's assume task.duration is the time left or total duration.
            // If it's total duration, we need logic to subtract elapsed.
            // Assuming this is a simple decrement for now based on user request "time shesh hoye gele".
            
            // However, better logic: fetch remaining time from server or just user simple local countdown
            // For simplicity and immediate response to user request:
            setRemainingTime(task.duration); 
        } else {
            setRemainingTime(null);
        }
    }
  }, [task]);

  useEffect(() => {
    let interval;
    if (remainingTime !== null && task?.status === 'IN_PROGRESS' && !task?.isStopped) {
        interval = setInterval(async () => {
            setRemainingTime((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [remainingTime, task]);

  const handleExpire = async () => {
      try {
          await api.patch(`/tasks/${id}/expire`); // Assuming an expire endpoint exists or we use stop/reject
          // If no specific expire endpoint, we might need one or reuse failing status
          // Let's assume we can set status to expired.
          // Updating local state first
          setTask(prev => ({ ...prev, status: 'EXPIRED' }));
          toast.error("Time Expired! Task ended.");
          fetchTask();
      } catch (e) {
          console.error("Failed to expire task", e);
      }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data);
    } catch (err) {
      toast.error("Failed to fetch mission data");
      navigate('/my-tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    // Check mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        toast.error("Tasks can only be performed on a Desktop computer.");
        return;
    }

    // Check extension for non-admin users
    if (currentUser.role !== 'ADMIN' && !extensionInstalled) {
      setShowExtensionModal(true);
      return;
    }
    
    try {
        await api.patch(`/tasks/${id}/start`);
        fetchTask();
        toast.success("Task started");
    } catch (e) { toast.error("Failed to start"); }
  };

  const handleStop = async () => {
    try {
        await api.patch(`/tasks/${id}/stop`);
        fetchTask();
        toast.success("Task paused");
    } catch (e) { toast.error("Failed to pause"); }
  };

  const handleComplete = async (notes) => {
    try {
        await api.patch(`/tasks/${id}/complete`, { submissionNotes: notes });
        fetchTask();
        toast.success("Task submitted");
        setShowSubmitModal(false);
    } catch (e) { toast.error(e.response?.data?.message || "Failed to submit"); }
  };

  const handleToggleSubTask = async (id) => {
    try {
        await api.patch(`/tasks/subtasks/${id}/toggle`);
        fetchTask();
    } catch (e) { toast.error("Toggle failed"); }
  };

  const handleToggleSubSubTask = async (id) => {
    try {
        await api.patch(`/tasks/subsubtasks/${id}/toggle`);
        fetchTask();
    } catch (e) { toast.error("Toggle failed"); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || addingComment) return;
    setAddingComment(true);
    try {
      const res = await api.post(`/tasks/${id}/comments`, { content: commentContent });
      setTask(prev => ({ ...prev, comments: [res.data, ...prev.comments] }));
      setCommentContent('');
      toast.success("Log entry added");
    } catch (e) {
      toast.error("Failed to add log entry");
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      setTask(prev => ({ ...prev, comments: prev.comments.filter(c => c.id !== commentId) }));
      toast.success("Entry deleted");
    } catch (e) {
      toast.error("Deletion failed");
    }
  };

  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadId = toast.loading("Uploading artifact...");
    try {
      const res = await api.post(`/tasks/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTask(res.data);
      toast.success("Artifact encrypted and stored", { id: loadId });
    } catch (e) {
      toast.error("Upload failed: Signal interference", { id: loadId });
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Clock className="w-10 h-10 animate-spin text-blue-500" /></div>;
  if (!task) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      {/* Top Bar */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm">
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Info */}
        <div className="flex-1 space-y-8">
          <div className="glass-card p-8 border-t-4 border-t-blue-500 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
               <div className="flex gap-4">
                  <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", {
                     'bg-emerald-100 text-emerald-600': task.status === 'COMPLETED',
                     'bg-blue-100 text-blue-600': task.status === 'IN_PROGRESS' || task.status === 'UNDER_REVIEW',
                     'bg-rose-100 text-rose-600': task.status === 'EXPIRED' || task.status === 'REJECTED',
                     'bg-slate-100 text-slate-500': task.status === 'PENDING'
                  })}>
                      {task.status === 'COMPLETED' ? <CheckCircle2 className="w-8 h-8" /> :
                       task.status === 'IN_PROGRESS' ? <Clock className="w-8 h-8 animate-pulse" /> :
                       <LayoutDashboard className="w-8 h-8" />}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{task.title}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-slate-400">ID: {task.id.split('-')[0]}</span>
                        <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase">
                           {(task.category || 'GENERAL').replace('_', ' ')}
                        </span>
                    </div>
                  </div>
               </div>
               
               <div className="flex flex-row md:flex-col justify-between md:text-right">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status</span>
                  <span className="text-lg font-black text-blue-600 uppercase">{(task.status || 'PENDING').replace('_', ' ')}</span>
               </div>
            </div>

            {/* Task Controls */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl mb-8 flex flex-wrap items-center gap-4">
               {task.userId === currentUser.id && (
                 <>
                   {task.status === 'PENDING' && !task.isStopped && (
                      <button onClick={handleStart} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                         <Play className="w-5 h-5" /> Start Task
                      </button>
                   )}
                   {task.status === 'IN_PROGRESS' && !task.isStopped && (
                      <div className="flex items-center gap-3">
                         <button onClick={() => setShowSubmitModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
                            <CheckCircle2 className="w-5 h-5" /> Submit Task
                         </button>
                         {task.type === 'PRACTICE' && (
                            <button onClick={handleStop} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-300 transition-all">
                               <StopCircle className="w-5 h-5" /> Pause
                            </button>
                         )}
                      </div>
                   )}
                   {task.isStopped && (
                      <button onClick={handleStart} className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all">
                         <Play className="w-5 h-5" /> Resume Task
                      </button>
                   )}
                 </>
               )}
            </div>

            <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8 bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 italic">
              "{task.description || "No info provided."}"
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Priority', value: task.priority || 'MEDIUM', icon: AlertCircle, color: 'blue' },
                 { label: 'Type', value: task.type, icon: FileText, color: 'purple' },
                 { 
                   label: remainingTime !== null ? 'Time Remaining' : 'Duration', 
                   value: remainingTime !== null ? `${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s` : `${task.duration / 60}m`, 
                   icon: Clock, 
                   color: remainingTime !== null && remainingTime < 60 ? 'rose' : 'emerald' 
                 },
                 { label: 'Distractions', value: task.focusLosses || 0, icon: Lock, color: 'rose' }
               ].map((item, i) => (
                 <div key={i} className="flex flex-col p-3 bg-[var(--card)]/30 rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-1">
                       <item.icon className="w-3 h-3 text-[var(--muted)]" />
                       <span className="text-[8px] font-black uppercase tracking-widest text-[var(--muted)]">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-[var(--foreground)] uppercase truncate">{item.value}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Sub-tasks Implementation */}
          {(task.subTasks?.length > 0) && (
              <div className="space-y-4">
                  <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight">Checklist</h3>
                  </div>
                  <div className="glass-card overflow-hidden">
                      <div className="divide-y divide-[var(--border)]">
                          {task.subTasks.map(sub => (
                              <div key={sub.id} className="p-4 group">
                                  <div className="flex items-center gap-4">
                                      <button 
                                        onClick={() => handleToggleSubTask(sub.id)}
                                        className={clsx("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0", 
                                            sub.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-[var(--border)] hover:border-blue-500"
                                        )}
                                      >
                                          {sub.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                          <div className={clsx("font-bold text-sm uppercase tracking-tight transition-all", sub.isCompleted ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]")}>
                                              {sub.title}
                                          </div>
                                          {sub.description && <p className="text-[10px] text-[var(--muted)] mt-0.5">{sub.description}</p>}
                                      </div>
                                  </div>
                                  {sub.subSubTasks?.length > 0 && (
                                      <div className="mt-3 ml-10 space-y-2">
                                          {sub.subSubTasks.map(ss => (
                                              <div key={ss.id} className="flex items-center gap-3">
                                                  <button 
                                                    onClick={() => handleToggleSubSubTask(ss.id)}
                                                    className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0", 
                                                        ss.isCompleted ? "bg-blue-500 border-blue-500 text-white" : "border-[var(--border)] hover:border-blue-500"
                                                    )}
                                                  >
                                                      {ss.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                                  </button>
                                                  <span className={clsx("text-[10px] font-medium uppercase tracking-widest transition-all", ss.isCompleted ? "text-[var(--muted)] line-through" : "text-[var(--muted)]")}>
                                                      {ss.title}
                                                  </span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* Comments Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight">Task Comments</h3>
             </div>

             <form onSubmit={handleAddComment} className="relative group">
                <textarea 
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Enter debrief notes..."
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 pr-16 text-sm text-[var(--foreground)] focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[100px] transition-all resize-none shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!commentContent.trim() || addingComment}
                  className="absolute bottom-4 right-4 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
             </form>

             <div className="space-y-4">
                {task.comments?.map(comment => (
                  <div key={comment.id} className="glass-card p-4 flex gap-4 group">
                     <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--border)] shrink-0">
                        {comment.user.avatarUrl ? (
                          <img src={comment.user.avatarUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black italic">{comment.user.email[0].toUpperCase()}</div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <span className="font-bold text-sm text-blue-500">{comment.user.name || comment.user.email}</span>
                           <div className="flex items-center gap-3">
                              <span className="text-[9px] text-[var(--muted)] font-black uppercase">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              {(comment.userId === currentUser.id || currentUser.role === 'ADMIN') && (
                                <button onClick={() => handleDeleteComment(comment.id)} className="p-1 hover:bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded">
                                   <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                           </div>
                        </div>
                        <p className="text-xs text-[var(--muted)] leading-relaxed">{comment.content}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-6">
           {/* Tags */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                 {task.tags?.length > 0 ? task.tags.map(tag => (
                   <span key={tag} className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700">#{tag}</span>
                 )) : <span className="text-[10px] text-slate-400 italic">No keywords</span>}
              </div>
           </div>

           {/* Attachments */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Task Files</h4>
                 {(task.userId === currentUser.id || currentUser.role === 'ADMIN') && (
                   <>
                     <input type="file" id="artifact-upload" className="hidden" onChange={handleUploadAttachment} />
                     <label htmlFor="artifact-upload" className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded cursor-pointer transition-all">
                        <Plus className="w-4 h-4" />
                     </label>
                   </>
                 )}
              </div>
              <div className="space-y-3">
                 {task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 ? (
                   task.attachments.map((file, i) => (
                     <a key={i} href={file.url} target="_blank" className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-all group">
                        <Paperclip className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-bold uppercase truncate flex-1">{file.name}</span>
                        <Link className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                     </a>
                   ))
                 ) : (
                   <div className="flex flex-col items-center py-4 text-center opacity-50">
                      <Lock className="w-8 h-8 text-slate-300 mb-2" />
                      <span className="text-[10px] font-bold uppercase italic">No files attached</span>
                   </div>
                 )}
              </div>
           </div>

           {/* Assignee */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl border-l-4 border-l-purple-500">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Assigned To</h4>
              {task.user ? (
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                      {task.user.avatarUrl ? <img src={task.user.avatarUrl} className="w-full h-full object-cover rounded-xl" /> : task.user.email[0].toUpperCase()}
                   </div>
                   <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{task.user.name || "Unknown User"}</div>
                      <div className="text-[10px] font-medium text-slate-400 truncate">{task.user.email}</div>
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-amber-500">
                   <AlertCircle className="w-5 h-5" />
                   <span className="text-[10px] font-bold uppercase">Not Assigned</span>
                </div>
              )}
           </div>
           
           {/* Activity Monitor for Admins */}
           {currentUser.role === 'ADMIN' && (
             <TaskActivityMonitor taskId={id} />
           )}
        </div>
      </div>

      <SubmitTaskModal 
        isOpen={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleComplete}
        taskTitle={task.title}
      />

      {/* Extension Required Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 border border-rose-500 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
              <button 
                onClick={() => setShowExtensionModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 rounded-full p-2 transition-all z-10"
              >
                <Trash2 className="w-5 h-5 rotate-45 transform" /> {/* X icon workaround using rotated trash or just use X from lucide if imported, but Trash2 is imported so using X logic or imported X */}
              </button>
              
              <div className="p-1">
                 <ExtensionRequiredBanner />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
