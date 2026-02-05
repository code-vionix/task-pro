
/**
 * AuthStatus displays status messages (error/info) with premium styling.
 */
export default function AuthStatus({ error, info }) {
  if (!error && !info) return null;

  return (
    <div className="space-y-4 mb-8 animate-in slide-in-from-top-2 duration-300">
      {error && (
        <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border bg-rose-500/10 text-rose-500 border-rose-500/20 flex items-center gap-3 shadow-lg shadow-rose-500/5">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          {error}
        </div>
      )}
      {info && (
        <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-3 shadow-lg shadow-emerald-500/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {info}
        </div>
      )}
    </div>
  );
}
