
import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function ProfileFollowList({ userId, type, currentUserId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await api.get(`/users/${userId}/${type}`);
        setList(res.data);
      } catch (err) {
        console.error(`Failed to fetch ${type}`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [userId, type]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-[var(--card)]/50 rounded-2xl animate-pulse border border-[var(--border)]" />
        ))}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--card)]/30 rounded-3xl border border-dashed border-[var(--border)]">
        <p className="text-[var(--muted)] font-medium capitalize">No {type} found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map(item => {
        const profile = type === 'followers' ? item.follower : item.following;
        
        // Skip if profile is undefined or null
        if (!profile) return null;
        
        return (
          <div 
            key={profile.id}
            className="glass-card p-4 flex items-center gap-4 hover:bg-[var(--card-hover)] transition-all group"
          >
            <div 
              className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer bg-[var(--border)]"
              onClick={() => navigate(`/profile/${profile.id}`)}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-black italic">
                   {profile.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 
                className="font-bold text-[var(--foreground)] truncate cursor-pointer hover:text-blue-500"
                onClick={() => navigate(`/profile/${profile.id}`)}
              >
                {profile.name || profile.email?.split('@')[0] || 'Unknown User'}
              </h4>
              <p className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest truncate">
                {profile.email || 'No email'}
              </p>
            </div>

            {profile.id !== currentUserId && (
               <button 
                 onClick={() => navigate(`/profile/${profile.id}`)}
                 className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-blue-500 hover:border-blue-500 transition-all opacity-0 group-hover:opacity-100"
               >
                 <User className="w-4 h-4" />
               </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
