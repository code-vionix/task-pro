
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Clock, LayoutDashboard, Play, StopCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function TaskItem({ task, isAdmin, onStart, onComplete, onStop, onDelete, onAssign, depth = 0 }) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = (task.subTasks && task.subTasks.length > 0) || (task.subSubTasks && task.subSubTasks.length > 0);
    const [timeLeft, setTimeLeft] = useState(null);

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
            
            // Only tick if not stopped
            if (!task.isStopped) {
                const interval = setInterval(updateTimer, 1000);
                return () => clearInterval(interval);
            }
        }
    }, [task]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="transition-all duration-300">
            <div className={clsx("group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[var(--card-hover)] gap-4", 
                depth > 0 && "border-l border-[var(--border)] bg-[var(--card)]/50",
                depth === 1 ? 'pl-8 sm:pl-10' : depth === 2 ? 'pl-12 sm:pl-16' : ''
            )}>
                <div className="flex items-center gap-4 min-w-0">
                    {hasChildren && (
                        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-[var(--border)] rounded shrink-0">
                            {expanded ? <ChevronDown className="w-4 h-4 text-[var(--muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--muted)]" />}
                        </button>
                    )}
                    <div className={clsx("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0", {
                        'bg-emerald-500/10 text-emerald-500': task.status === 'COMPLETED',
                        'bg-blue-500/10 text-blue-500': task.status === 'IN_PROGRESS',
                        'bg-rose-500/10 text-rose-500': task.status === 'EXPIRED',
                        'bg-[var(--muted)]/10 text-[var(--muted)]': task.status === 'PENDING'
                    })}>
                        {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> :
                         task.status === 'IN_PROGRESS' ? <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" /> :
                         task.status === 'EXPIRED' ? <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" /> :
                         <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                             <h4 className={clsx("font-bold text-[var(--foreground)] group-hover:text-blue-500 transition-colors truncate", depth > 0 ? "text-sm" : "")}>{task.title}</h4>
                             {task.type === 'EXAM' && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Exam</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                             <span className={clsx("text-[9px] uppercase font-bold px-2 py-0.5 rounded shrink-0", {
                                 'bg-blue-500/20 text-blue-400': task.status === 'IN_PROGRESS',
                                 'bg-emerald-500/20 text-emerald-400': task.status === 'COMPLETED',
                                 'bg-rose-500/20 text-rose-400': task.status === 'EXPIRED',
                                 'bg-[var(--muted)]/20 text-[var(--muted)]': task.status === 'PENDING'
                             })}>{task.status}</span>
                             
                             {task.status === 'IN_PROGRESS' && timeLeft !== null && (
                                 <span className="text-[11px] font-mono font-bold text-blue-500 animate-pulse shrink-0">
                                     {formatTime(timeLeft)} left
                                 </span>
                             )}
                             
                             {task.isStopped && task.status === 'IN_PROGRESS' && (
                                 <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 shrink-0">
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
                         <button onClick={() => onAssign(task.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-2 animate-pulse whitespace-nowrap">
                            <LayoutDashboard className="w-3 h-3" /> Claim
                        </button>
                    )}

                    {!isAdmin && task.userId && (
                        <>
                            {task.status === 'PENDING' && !task.isStopped && (
                                <button onClick={() => onStart(task.id)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap">
                                    <Play className="w-3 h-3" /> Start
                                </button>
                            )}
                            {task.status === 'IN_PROGRESS' && !task.isStopped && (
                                 <div className="flex items-center gap-2">
                                    <button onClick={() => onComplete(task.id)} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap">
                                        <CheckCircle2 className="w-3 h-3" /> Submit
                                    </button>
                                    {task.type === 'PRACTICE' && (
                                        <button onClick={() => onStop(task.id)} className="p-2 hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-colors" title="Pause Task">
                                            <StopCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                 </div>
                            )}
                            {task.isStopped && (
                                <button onClick={() => onStart(task.id)} className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap">
                                    <Play className="w-3 h-3" /> Resume
                                </button>
                            )}
                        </>
                    )}

                    {isAdmin && (
                        <div className="flex items-center gap-1">
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
                       <TaskItem key={sub.id} task={sub} isAdmin={isAdmin} onStart={onStart} onComplete={onComplete} onStop={onStop} onDelete={onDelete} onAssign={onAssign} depth={depth + 1} />
                   ))}
                   {task.subSubTasks?.map((sub) => (
                       <TaskItem key={sub.id} task={sub} isAdmin={isAdmin} onStart={onStart} onComplete={onComplete} onStop={onStop} onDelete={onDelete} onAssign={onAssign} depth={depth + 1} />
                   ))}
                </div>
            )}
        </div>
    )
}

export function StatsCard({ icon, label, value, subValue, color }) {
  return (
    <div className="glass-card p-6 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <h3 className="text-[var(--muted)] text-xs font-bold uppercase tracking-widest mb-2">{label}</h3>
        <div className="text-4xl font-extrabold text-[var(--foreground)] tracking-tight mb-2 tabular-nums">
           {value}
        </div>
        {subValue && (
            <p className={clsx("text-xs font-bold", 
                color === 'blue' ? 'text-blue-500' : 
                color === 'emerald' ? 'text-emerald-500' : 'text-[var(--muted)]'
            )}>
              {subValue}
            </p>
        )}
      </div>
      <div className={clsx("relative z-10 p-4 rounded-2xl transition-all duration-300 border border-[var(--border)]", 
          color === 'blue' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-blue-500/10' : 
          color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-emerald-500/10' : 'bg-[var(--card)] text-[var(--muted)] group-hover:bg-[var(--card-hover)]'
      )}>
        {icon}
      </div>
    </div>
  )
}
