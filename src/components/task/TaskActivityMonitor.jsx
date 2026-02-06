import { Activity, AlertCircle, Clock, ExternalLink, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function TaskActivityMonitor({ taskId }) {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
    const interval = setInterval(fetchActivityLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [taskId]);

  const fetchActivityLogs = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      const logs = Array.isArray(res.data.activityLogs) ? res.data.activityLogs : [];
      setActivityLogs(logs.reverse()); // Show newest first
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    if (type.includes('URL')) return Globe;
    if (type.includes('TAB')) return Activity;
    return AlertCircle;
  };

  const getActivityColor = (type) => {
    if (type.includes('BLUR') || type.includes('SWITCH')) return 'text-rose-500';
    if (type.includes('FOCUS') || type.includes('RETURN')) return 'text-emerald-500';
    if (type.includes('URL')) return 'text-blue-500';
    return 'text-slate-500';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight">
            Live Activity Monitor
          </h3>
        </div>
        <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">
          {activityLogs.length} Events
        </span>
      </div>

      {activityLogs.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-bold uppercase tracking-widest">No activity logged yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activityLogs.map((log, index) => {
            const Icon = getActivityIcon(log.type);
            const colorClass = getActivityColor(log.type);
            
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-[var(--card)]/30 rounded-xl border border-[var(--border)] hover:bg-[var(--card-hover)] transition-all"
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colorClass}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-black uppercase tracking-widest ${colorClass}`}>
                      {log.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {log.url && (
                    <a
                      href={log.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 truncate group"
                    >
                      <span className="truncate">{log.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  
                  {log.duration && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--muted)]">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono font-bold">Away for {formatDuration(log.duration)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
