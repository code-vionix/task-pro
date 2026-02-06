
import clsx from 'clsx';
import { Star, Trophy, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/tasks/leaderboard');
        setLeaderboard(res.data);
      } catch (err) {
        toast.error("Telemetry failed to synchronize");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return (
     <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-[var(--card)]/50 rounded-2xl animate-pulse border border-[var(--border)]" />
        ))}
     </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2 text-amber-500">
            <Trophy className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest uppercase">Central Rankings</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tighter uppercase italic">
             Hall of <span className="text-amber-500">Valor</span>
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-lg text-sm font-medium uppercase tracking-tight italic">
             High-octane performance data extracted from mission logs.
          </p>
        </div>
      </header>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {leaderboard.slice(0, 3).map((user, i) => (
           <div key={user.id} className={clsx("relative glass-card p-8 flex flex-col items-center text-center group transition-all duration-500 hover:-translate-y-2", {
              'border-amber-500/50 order-first md:order-none scale-105 z-10': i === 0,
              'border-slate-400/50': i === 1,
              'border-orange-500/50': i === 2
           })}>
              <div className={clsx("absolute -top-4 w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-lg", {
                 'bg-amber-500 text-black': i === 0,
                 'bg-slate-400 text-black': i === 1,
                 'bg-orange-500 text-black': i === 2
              })}>
                 {i + 1}
              </div>
              
              <div className="w-24 h-24 rounded-3xl overflow-hidden mb-4 border-4 border-black/20 shadow-2xl relative">
                 {user.avatarUrl ? (
                   <img src={user.avatarUrl} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-black/20 text-3xl font-black italic">
                      {user.email[0].toUpperCase()}
                   </div>
                 )}
                 {i === 0 && <Star className="absolute top-2 right-2 w-5 h-5 text-amber-500 fill-amber-500 animate-spin" />}
              </div>

              <h4 className="text-xl font-black text-[var(--foreground)] uppercase truncate w-full">{user.name || user.email.split('@')[0]}</h4>
              <p className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest mb-4">Rank {i + 1} Operator</p>
              
              <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-[var(--border)]">
                 <div>
                    <div className="text-sm font-black text-amber-500">{user.totalScore}</div>
                    <div className="text-[8px] font-black uppercase text-[var(--muted)]">Total Points</div>
                 </div>
                 <div>
                    <div className="text-sm font-black text-blue-500">{user.taskCount}</div>
                    <div className="text-[8px] font-black uppercase text-[var(--muted)]">Missions</div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* List View for the rest */}
      <div className="glass-card overflow-hidden">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-[var(--card)]/50 border-b border-[var(--border)]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Rank</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Operator</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Points</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Efficiency</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Level</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
               {leaderboard.map((user, i) => (
                 <tr key={user.id} className="hover:bg-[var(--card-hover)] transition-colors group">
                    <td className="px-6 py-4">
                       <span className={clsx("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs", {
                          'bg-amber-500/10 text-amber-500': i === 0,
                          'bg-slate-400/10 text-slate-400': i === 1,
                          'bg-orange-500/10 text-orange-500': i === 2,
                          'bg-[var(--border)] text-[var(--muted)]': i > 2
                       })}>
                          {i + 1}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--border)] shrink-0 group-hover:scale-110 transition-transform">
                             {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black">{user.email[0].toUpperCase()}</div>}
                          </div>
                          <div className="min-w-0">
                             <div className="font-black text-[var(--foreground)] uppercase truncate">{user.name || user.email.split('@')[0]}</div>
                             <div className="text-[9px] text-[var(--muted)] font-black uppercase tracking-tighter">{user.email}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="font-black text-[var(--foreground)]">{user.totalScore}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="w-24 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(100, (user.totalScore / (leaderboard[0]?.totalScore || 1)) * 100)}%` }} 
                          />
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase rounded-md border border-blue-500/20">
                          Elite Class {Math.floor(user.totalScore / 500) + 1}
                       </span>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
