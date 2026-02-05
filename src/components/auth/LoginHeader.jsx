
import { Fingerprint } from 'lucide-react';

/**
 * LoginHeader displays the brand logo and welcome message.
 */
export default function LoginHeader() {
  return (
    <div className="flex flex-col items-center mb-8 text-center animate-in zoom-in duration-700">
      <div className="w-20 h-20 rounded-[2rem] premium-gradient flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/30 ring-4 ring-[var(--background)] group transform hover:rotate-6 transition-all duration-500">
        <Fingerprint className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
      </div>
      <h1 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tighter mb-2 uppercase italic">
        Operational <span className="text-blue-500">Access</span>
      </h1>
      <p className="text-[var(--muted)] text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
        Secure authentication required for grid entry
      </p>
    </div>
  );
}
