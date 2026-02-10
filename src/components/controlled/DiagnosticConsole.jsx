import { Cpu } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function DiagnosticConsole() {
  const { systemStats } = useSelector((state) => state.remoteControl);
  
  const stats = [
    { label: 'BATTERY', val: `${systemStats.battery}%`, color: 'blue' },
    { label: 'USED SPACE', val: `${systemStats.storageUsed}%`, color: 'indigo' },
    { label: 'FREE SPACE', val: `${systemStats.storageAvailable} GB`, color: 'purple' },
    { label: 'STATUS', val: 'HEALTHY', color: 'emerald' }
  ];

  return (
    <div className="space-y-4">
       <h3 className="text-[10px] font-bold text-muted-main uppercase tracking-widest px-2 flex items-center gap-3">
          <Cpu className="w-3 h-3 text-primary-main" /> Device Info
       </h3>
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-surface-main/40 p-4 rounded-2xl border border-border-main flex flex-col gap-1">
               <span className="text-[10px] font-bold text-muted-main tracking-wider">{stat.label}</span>
               <span className="text-lg font-bold text-foreground-main">{stat.val}</span>
            </div>
          ))}
       </div>
    </div>
  );
}
