
import { User as UserIcon } from 'lucide-react';

/**
 * ProfileSidebar displays additional user metadata and performance metrics.
 */
export default function ProfileSidebar({ user }) {
  return (
    <div className="space-y-6">
      {/* 1. Technical Details */}
      <div className="glass-card p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
        <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] flex items-center gap-2">
          <UserIcon className="w-3 h-3 text-blue-500" /> Neural metadata
        </h3>
        
        <div className="space-y-4">
          {user.address && (
            <DetailItem label="Location" value={user.address} color="text-blue-500" />
          )}
          {user.education && (
            <DetailItem label="Education" value={user.education} color="text-purple-500" />
          )}
          <DetailItem 
            label="Joined" 
            value={new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} 
            color="text-emerald-500" 
          />
        </div>
      </div>

      {/* 2. Performance Metrics */}
      <div className="glass-card p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
        <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] flex items-center gap-2">
          Operational Status
        </h3>
        
        <div className="space-y-4">
          <MetricItem label="Efficiency" value="98.4%" color="text-emerald-400" />
          <MetricItem label="Clearance" value="ELITE-LEVEL" color="text-blue-400" isItalic />
          <MetricItem label="System Status" value="ACTIVE" color="text-purple-400" isTracking />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, color }) {
  return (
    <div className="flex flex-col gap-1 p-3 hover:bg-[var(--card-hover)] rounded-xl transition-all border border-transparent hover:border-[var(--border)]">
      <span className={clsx("text-[10px] uppercase font-black tracking-widest opacity-70", color)}>{label}</span>
      <span className="text-sm font-bold text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function MetricItem({ label, value, color, isItalic, isTracking }) {
  return (
    <div className="flex justify-between items-center p-3 hover:bg-[var(--card-hover)] rounded-xl transition-colors">
      <span className="text-sm font-bold text-[var(--foreground)]">{label}</span>
      <span className={clsx("font-mono font-black", color, isItalic && "italic", isTracking && "tracking-widest")}>
        {value}
      </span>
    </div>
  );
}

import clsx from 'clsx';
