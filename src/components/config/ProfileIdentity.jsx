
import { Camera, User as UserIcon } from 'lucide-react';
import { useRef } from 'react';

/**
 * ProfileIdentity handles the avatar display and upload interface.
 */
export default function ProfileIdentity({ user, onAvatarUpload, profileName }) {
  const fileInputRef = useRef(null);

  return (
    <section className="glass-card p-10 text-center relative overflow-hidden group shadow-2xl border-[var(--border)]">
      <div className="absolute top-0 left-0 w-full h-1.5 premium-gradient opacity-40"></div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] mb-8 italic">Neural Identity</h3>
      
      <div className="relative inline-block">
        <div className="w-40 h-40 rounded-[2.5rem] premium-gradient p-1.5 shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-all duration-700 hover:rotate-2">
          <div className="w-full h-full rounded-[2.2rem] bg-[var(--card)] overflow-hidden flex items-center justify-center border-2 border-white/10 shadow-inner">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Identity" />
            ) : (
              <UserIcon className="w-16 h-16 text-[var(--muted)] opacity-50" />
            )}
          </div>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-2 -right-2 p-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all hover:scale-110 active:scale-90 border-4 border-[var(--background)]"
        >
          <Camera className="w-6 h-6" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) onAvatarUpload(file);
          }}
        />
      </div>

      <div className="mt-8">
        <h4 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight italic">{profileName || 'Anonymous Entity'}</h4>
        <div className="flex justify-center mt-3">
          <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[10px] font-black tracking-[0.3em] uppercase rounded-full">
            {user?.role} CLEARANCE
          </span>
        </div>
      </div>
    </section>
  );
}
