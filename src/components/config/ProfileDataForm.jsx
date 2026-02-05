
import { BookOpen, Globe, Loader2, MapPin, Save, User as UserIcon } from 'lucide-react';
import FormInput from './FormInput';

/**
 * ProfileDataForm handles the core user metadata fields.
 */
export default function ProfileDataForm({ profile, setProfile, onSubmit, isSaving }) {
  return (
    <section className="glass-card p-10 relative overflow-hidden shadow-2xl border-[var(--border)]">
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
          <UserIcon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tighter italic">Personal Matrix</h2>
          <p className="text-[var(--muted)] text-xs font-black uppercase tracking-[0.2em] opacity-60">Synchronize Identity Data</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormInput 
            label="Designation Name" 
            value={profile.name} 
            onChange={(v) => setProfile({...profile, name: v})} 
            placeholder="Identity Label" 
            icon={<UserIcon className="w-4 h-4" />}
          />
          <FormInput 
            label="Neural Link (Email)" 
            value={profile.email} 
            placeholder="Verified Endpoint" 
            disabled 
            icon={<Globe className="w-4 h-4" />}
          />
        </div>

        <FormInput 
          label="Operational Biography" 
          value={profile.bio} 
          onChange={(v) => setProfile({...profile, bio: v})} 
          placeholder="Transmit your background narrative..." 
          isTextarea
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormInput 
            label="Physical Sector (Address)" 
            value={profile.address} 
            onChange={(v) => setProfile({...profile, address: v})} 
            placeholder="Geographic Coordinates" 
            icon={<MapPin className="w-4 h-4" />}
          />
          <FormInput 
            label="Intellectual Tier (Education)" 
            value={profile.education} 
            onChange={(v) => setProfile({...profile, education: v})} 
            placeholder="Educational Level" 
            icon={<BookOpen className="w-4 h-4" />}
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full premium-gradient text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/30 uppercase tracking-[0.3em] text-[11px] hover:opacity-90"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Synchronized Data
        </button>
      </form>
    </section>
  );
}
