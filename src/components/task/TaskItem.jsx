import clsx from 'clsx';
import { AlertCircle, Ban, CheckCircle2, ChevronDown, ChevronRight, Clock, Code, LayoutDashboard, Megaphone, Play, PlayCircle, Share2, ShieldAlert, StopCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SubmitTaskModal from './SubmitTaskModal';

export default function TaskItem({ 
    task, isAdmin, onStart, onComplete, onStop, onDelete, onAssign, 
    handleApprove, handleReject, onToggleSubTask, onToggleSubSubTask, depth = 0 
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = (task.subTasks && task.subTasks.length > 0) || (task.subSubTasks && task.subSubTasks.length > 0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const getCategoryIcon = (category) => {
    switch(category) {
        case 'WEB_DEV': return Code;
        case 'SOCIAL_MEDIA': return Share2;
        case 'VIDEO_ENGAGEMENT': return PlayCircle;
        case 'MARKETING': return Megaphone;
        default: return LayoutDashboard;
    }
  };

  const CategoryIcon = getCategoryIcon(task.category);

  useEffect(() => {
    if (task.status === 'IN_PROGRESS' && task.startedAt && task.duration) {
      const updateTimer = () => {
        const start = new Date(task.startedAt).getTime();
        let now = Date.now();
        
        if (task.isStopped && task.lastStoppedAt) {
          now = new Date(task.lastStoppedAt).getTime();
        }

        const elapsed = (now - start) / 1000;
        const remaining = Math.max(0, task.duration - elapsed);
        setTimeLeft(remaining);
      };

      updateTimer(); 
      
      if (!task.isStopped) {
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [task]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const internalSubmit = (notes) => {
      onComplete(task.id, notes);
      setShowSubmitModal(false);
  };

  return (
    <div className="transition-all duration-300">
      <div className={clsx("group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[var(--card-hover)] gap-4", 
        depth > 0 && "border-l border-[var(--border)] bg-[var(--card)]/50",
        depth === 1 ? 'pl-8 sm:pl-10' : depth === 2 ? 'pl-12 sm:pl-16' : '',
        task.status === 'UNDER_REVIEW' && "bg-blue-500/[0.03] border-l-4 border-l-blue-500",
        task.status === 'REJECTED' && "bg-rose-500/[0.03] border-l-4 border-l-rose-500"
      )}>
        <div className="flex items-center gap-4 min-w-0">
          {(depth === 0 && hasChildren) && (
            <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-[var(--border)] rounded shrink-0">
              {expanded ? <ChevronDown className="w-4 h-4 text-[var(--muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--muted)]" />}
            </button>
          )}

          {depth > 0 && (
              <button 
                onClick={() => depth === 1 ? onToggleSubTask?.(task.id) : onToggleSubSubTask?.(task.id)}
                className={clsx("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", {
                  'bg-blue-600 border-blue-600 text-white': task.isCompleted,
                  'border-[var(--border)] hover:border-blue-500': !task.isCompleted
                })}
              >
                {task.isCompleted && <CheckCircle2 className="w-3 h-3" />}
              </button>
          )}

          <div className={clsx("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border-2", {
            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20': task.status === 'COMPLETED',
            'bg-blue-500/10 text-blue-500 border-blue-500/20': task.status === 'IN_PROGRESS' || task.status === 'UNDER_REVIEW',
            'bg-rose-500/10 text-rose-500 border-rose-500/20': task.status === 'EXPIRED' || task.status === 'REJECTED',
            'bg-[var(--muted)]/10 text-[var(--muted)] border-[var(--border)]': task.status === 'PENDING'
          })}>
            {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> :
             task.status === 'IN_PROGRESS' ? <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" /> :
             task.status === 'UNDER_REVIEW' ? <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" /> :
             task.status === 'REJECTED' ? <Ban className="w-5 h-5 sm:w-6 sm:h-6" /> :
             task.status === 'EXPIRED' ? <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" /> :
             <CategoryIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
               <h4 className={clsx("font-bold text-[var(--foreground)] group-hover:text-blue-500 transition-colors truncate", 
                 depth > 0 ? "text-sm" : "",
                 task.isCompleted && "line-through text-[var(--muted)]"
               )}>{task.title}</h4>
               {task.category && task.category !== 'GENERAL' && (
                  <span className="text-[8px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full uppercase font-black border border-blue-500/20">
                     {(task.category || 'GENERAL').replace('_', ' ')}
                  </span>
               )}
               {task.type === 'EXAM' && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase font-black shrink-0 border border-purple-500/30">Exam</span>}
               {task.isRecurring && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-black shrink-0 border border-emerald-500/30">Recurring</span>}
               
               <span className={clsx("text-[9px] px-1.5 py-0.5 rounded uppercase font-black shrink-0 border", {
                  'bg-rose-500/20 text-rose-500 border-rose-500/30': task.priority === 'URGENT',
                  'bg-orange-500/20 text-orange-500 border-orange-500/30': task.priority === 'HIGH',
                  'bg-blue-500/20 text-blue-400 border-blue-500/30': task.priority === 'MEDIUM',
                  'bg-slate-500/20 text-slate-400 border-slate-500/30': task.priority === 'LOW'
               })}>
                  {task.priority || 'MEDIUM'}
               </span>
            </div>
            
            <div className="flex items-center gap-3 mt-1 flex-wrap">
               <span className={clsx("text-[9px] uppercase font-black px-2 py-0.5 rounded shrink-0", {
                    'bg-blue-500/20 text-blue-400': task.status === 'IN_PROGRESS' || task.status === 'UNDER_REVIEW',
                    'bg-emerald-500/20 text-emerald-400': task.status === 'COMPLETED',
                    'bg-rose-500/20 text-rose-400': task.status === 'EXPIRED' || task.status === 'REJECTED',
                    'bg-[var(--muted)]/20 text-[var(--muted)]': task.status === 'PENDING'
               })}>{(task.status || 'PENDING').replace('_', ' ')}</span>
               
               {task.tags?.map(tag => (
                 <span key={tag} className="text-[9px] text-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded uppercase font-bold">#{tag}</span>
               ))}

               {task.status === 'IN_PROGRESS' && timeLeft !== null && (
                   <span className="text-[11px] font-mono font-black text-blue-500 animate-pulse shrink-0">
                       {formatTime(timeLeft)}
                   </span>
               )}
               
               {task.isStopped && task.status === 'IN_PROGRESS' && (
                   <span className="text-[11px] font-black text-rose-500 flex items-center gap-1 shrink-0">
                       <StopCircle className="w-3 h-3" /> PAUSED
                   </span>
               )}

              {task.description && (
                  <p className="text-xs text-[var(--muted)] hidden lg:block border-l border-[var(--border)] pl-3 ml-1 truncate">
                      {task.description}
                  </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          {!isAdmin && !task.userId && (
             <button onClick={() => onAssign(task.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 animate-pulse whitespace-nowrap shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="w-3 h-3" /> Claim Signal
            </button>
          )}

          <button 
             onClick={() => window.location.href = `/task/${task.id}`}
             className="px-3 py-1.5 bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] text-[var(--muted)] hover:text-blue-500 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
          >
            Details
          </button>

          {!isAdmin && task.userId && (
            <>
              {task.status === 'PENDING' && !task.isStopped && (
                <button onClick={() => onStart(task.id)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 whitespace-nowrap">
                    <Play className="w-3 h-3" /> Initiate
                </button>
              )}
              {task.status === 'IN_PROGRESS' && !task.isStopped && (
                 <div className="flex items-center gap-2">
                    <button onClick={() => setShowSubmitModal(true)} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> Transmit
                    </button>
                    {task.type === 'PRACTICE' && (
                        <button onClick={() => onStop(task.id)} className="p-2 hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-colors" title="Pause Task">
                            <StopCircle className="w-4 h-4" />
                        </button>
                    )}
                 </div>
              )}
              {task.isStopped && (
                <button onClick={() => onStart(task.id)} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 whitespace-nowrap">
                    <Play className="w-3 h-3" /> Resume
                </button>
              )}
            </>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2">
              {task.status === 'UNDER_REVIEW' && (
                  <>
                    <button onClick={() => handleApprove(task.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button 
                        onClick={() => {
                            const reason = prompt("Enter rejection reason:");
                            if (reason) handleReject(task.id, reason);
                        }} 
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20"
                    >
                        <Ban className="w-4 h-4" /> Reject
                    </button>
                  </>
              )}

              {task.status === 'IN_PROGRESS' && !task.isStopped && (
                <button onClick={() => onStop(task.id)} className="p-2 hover:bg-rose-500/20 text-[var(--muted)] hover:text-rose-500 rounded-lg transition-colors" title="Pause/Stop Task">
                    <StopCircle className="w-4 h-4" />
                </button>
              )}
              {task.isStopped && task.status === 'IN_PROGRESS' && (
                <button onClick={() => onStart(task.id)} className="p-2 hover:bg-emerald-500/20 text-[var(--muted)] hover:text-emerald-500 rounded-lg transition-colors" title="Resume Task">
                    <Play className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => onDelete(task.id)} className="p-2 hover:bg-rose-500/20 text-[var(--muted)] hover:text-rose-500 rounded-lg transition-colors" title="Delete Forever">
                  <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div>
           {task.subTasks?.map((sub) => (
               <TaskItem key={sub.id} task={sub} isAdmin={isAdmin} onStart={onStart} onComplete={onComplete} onStop={onStop} onDelete={onDelete} onAssign={onAssign} handleApprove={handleApprove} handleReject={handleReject} onToggleSubTask={onToggleSubTask} onToggleSubSubTask={onToggleSubSubTask} depth={depth + 1} />
           ))}
           {task.subSubTasks?.map((sub) => (
               <TaskItem key={sub.id} task={sub} isAdmin={isAdmin} onStart={onStart} onComplete={onComplete} onStop={onStop} onDelete={onDelete} onAssign={onAssign} handleApprove={handleApprove} handleReject={handleReject} onToggleSubTask={onToggleSubTask} onToggleSubSubTask={onToggleSubSubTask} depth={depth + 1} />
           ))}
        </div>
      )}

      <SubmitTaskModal 
        isOpen={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)}
        onSubmit={internalSubmit}
        taskTitle={task.title}
      />
    </div>
  );
}
