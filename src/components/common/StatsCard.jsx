
import clsx from 'clsx';

export default function StatsCard({ icon, label, value, subValue, color }) {
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
  );
}
