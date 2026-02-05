
import { FileText, Save, ShieldAlert } from 'lucide-react';

/**
 * ProfileBio component for displaying and editing the user's autobiography.
 */
export default function ProfileBio({ 
  user, 
  isOwnProfile, 
  isGuest, 
  isEditing, 
  setIsEditing, 
  bio, 
  setBio, 
  onSave 
}) {
  return (
    <div className="glass-card p-8 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-purple-400">
          <FileText className="w-6 h-6" />
          <h2 className="text-xl font-bold text-[var(--foreground)] uppercase italic tracking-tight">Biography</h2>
        </div>
        {isOwnProfile && !isEditing && !isGuest && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="text-xs font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
          >
            Edit Bio
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-4 animate-in fade-in">
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[150px] resize-none"
            placeholder="Write something about yourself..."
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--foreground)]">Cancel</button>
            <button onClick={onSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <Save className="w-4 h-4" /> Save Bio
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap relative z-10 text-sm font-medium">
          {bio || <span className="text-[var(--muted)] italic">No bio information provided.</span>}
        </p>
      )}

      {isGuest && isOwnProfile && (
        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Guest accounts cannot edit their bio.</span>
        </div>
      )}
    </div>
  );
}
