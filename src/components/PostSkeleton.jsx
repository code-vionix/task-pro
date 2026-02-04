
import { Loader2 } from 'lucide-react';

export function PostSkeleton() {
  return (
    <div className="glass-card overflow-hidden p-4 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full skeleton bg-[var(--card-hover)]" />
        <div className="space-y-2">
          <div className="w-24 h-4 rounded skeleton bg-[var(--card-hover)]" />
          <div className="w-32 h-3 rounded skeleton bg-[var(--card-hover)] opacity-50" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-4 rounded skeleton bg-[var(--card-hover)]" />
        <div className="w-full h-4 rounded skeleton bg-[var(--card-hover)]" />
        <div className="w-2/3 h-4 rounded skeleton bg-[var(--card-hover)]" />
      </div>
      <div className="w-full h-48 rounded-xl skeleton bg-[var(--card-hover)] flex items-center justify-center">
         <Loader2 className="w-6 h-6 animate-spin text-[var(--muted)] opacity-20" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="w-20 h-4 rounded skeleton bg-[var(--card-hover)]" />
        <div className="w-20 h-4 rounded skeleton bg-[var(--card-hover)]" />
      </div>
    </div>
  );
}
