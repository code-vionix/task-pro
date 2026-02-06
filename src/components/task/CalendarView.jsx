
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function CalendarView({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const getTasksForDay = (day) => {
    if (!day) return [];
    return tasks.filter(t => {
      const d = new Date(t.startTime);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="glass-card overflow-hidden bg-[var(--card)]/30 border border-[var(--border)] animate-in fade-in duration-500">
      <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]/50">
         <div className="flex items-center gap-4">
            <h3 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tighter italic">
               {monthName} <span className="text-blue-500">{year}</span>
            </h3>
         </div>
         <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-[var(--card-hover)] rounded-xl border border-[var(--border)] transition-colors">
               <ChevronLeft className="w-5 h-5 text-[var(--muted)]" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-[var(--card-hover)] rounded-xl border border-[var(--border)] transition-colors">
               <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[var(--border)]">
         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
           <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-[var(--muted)] border-r last:border-r-0 border-[var(--border)] bg-[var(--card)]/20">
              {d}
           </div>
         ))}
      </div>

      <div className="grid grid-cols-7">
         {[...padding, ...days].map((day, i) => {
           const dayTasks = getTasksForDay(day);
           const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

           return (
             <div key={i} className={clsx("min-h-[120px] p-2 border-r border-b border-[var(--border)] transition-all", {
                'bg-[var(--card)]/10': !day,
                'hover:bg-blue-500/5': day,
                'bg-blue-500/[0.03]': isToday
             })}>
                {day && (
                  <div className="flex flex-col h-full">
                     <div className={clsx("w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black transition-all mb-2", {
                        'bg-blue-600 text-white shadow-lg shadow-blue-500/20': isToday,
                        'text-[var(--muted)]': !isToday
                     })}>
                        {day}
                     </div>
                     <div className="space-y-1.5 overflow-y-auto max-h-[80px] scrollbar-hide">
                        {dayTasks.map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => window.location.href = `/task/${t.id}`}
                            className={clsx("group px-2 py-1.5 rounded-md border text-[9px] font-black uppercase truncate cursor-pointer transition-all hover:scale-[1.02]", {
                               'bg-emerald-500/10 border-emerald-500/20 text-emerald-400': t.status === 'COMPLETED',
                               'bg-blue-500/10 border-blue-500/20 text-blue-400': t.status === 'IN_PROGRESS',
                               'bg-rose-500/10 border-rose-500/20 text-rose-400': t.status === 'EXPIRED',
                               'bg-[var(--card)] border-[var(--border)] text-[var(--muted)]': t.status === 'PENDING'
                            })}
                          >
                             <div className="flex items-center gap-1">
                                {t.type === 'EXAM' && <div className="w-1 h-1 bg-rose-500 rounded-full shrink-0" />}
                                {t.title}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
           );
         })}
      </div>
    </div>
  );
}
