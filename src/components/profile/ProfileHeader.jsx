
import clsx from 'clsx';
import { BookOpen, Calendar, Camera, CheckCircle, Loader2, Mail, MapPin, MessageSquare, Move } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ProfileHeader component manages the banner, avatar, and basic user identity info.
 * Supports image uploading and repositioning for both cover and avatar images.
 */
export default function ProfileHeader({ 
  user, 
  isOwnProfile, 
  isGuest, 
  onAvatarClick, 
  onCoverClick, 
  uploadingAvatar, 
  uploadingCover,
  repositionMode,
  setRepositionMode,
  tempPos,
  handleMouseDown,
  savePosition,
  isFollowing,
  onFollow,
  loadingFollow
}) {
  const navigate = useNavigate();

  const currentCoverPos = repositionMode === 'cover' ? `${tempPos.x}% ${tempPos.y}%` : 
                          user.coverPosition ? `${user.coverPosition.x}% ${user.coverPosition.y}%` : 'center';
                          
  const currentAvatarPos = repositionMode === 'avatar' ? `${tempPos.x}% ${tempPos.y}%` : 
                           user.avatarPosition ? `${user.avatarPosition.x}% ${user.avatarPosition.y}%` : 'center';

  return (
    <div className="relative group">
      {/* 1. Cover Banner */}
      <div 
        className={clsx(
          "h-72 rounded-3xl bg-[var(--card)] overflow-hidden relative shadow-2xl border border-[var(--border)] transition-all",
          repositionMode === 'cover' ? "cursor-move ring-4 ring-blue-500/50" : "group-hover:border-[var(--primary)]/30"
        )}
        onMouseDown={(e) => handleMouseDown(e, 'cover')}
      >
        {user.coverImageUrl ? (
          <img 
            src={user.coverImageUrl} 
            alt="Cover" 
            draggable={false}
            className={clsx("w-full h-full object-cover transition-transform duration-700", !repositionMode && "group-hover:scale-105")}
            style={{ objectPosition: currentCoverPos }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/90 via-transparent to-transparent"></div>
      </div>

      {/* Action Buttons for Cover */}
      {isOwnProfile && !isGuest && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {repositionMode === 'cover' ? (
            <button onClick={savePosition} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in zoom-in">
              <CheckCircle className="w-4 h-4" /> Save Position
            </button>
          ) : (
            <>
              <button 
                onClick={() => setRepositionMode('cover')} 
                className="glass-card hover:bg-white/10 text-white p-2 rounded-xl backdrop-blur-md" 
                title="Reposition Banner"
              >
                <Move className="w-5 h-5" />
              </button>
              <button onClick={onCoverClick} className="glass-card hover:bg-white/10 text-white p-2 rounded-xl backdrop-blur-md">
                {uploadingCover ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      )}

      {/* 2. Avatar & Identity Overlay */}
      <div className="absolute -bottom-16 left-8 flex items-end gap-6 w-[calc(100%-4rem)]">
        <div className="relative group/avatar">
          <div 
            className={clsx(
              "w-36 h-36 rounded-3xl border-4 border-[var(--background)] overflow-hidden shadow-2xl relative bg-[var(--card)]",
              repositionMode === 'avatar' ? "cursor-move ring-4 ring-emerald-500/50" : ""
            )}
            onMouseDown={(e) => handleMouseDown(e, 'avatar')}
          >
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                draggable={false}
                className="w-full h-full object-cover"
                style={{ objectPosition: currentAvatarPos }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[var(--card)] text-[var(--foreground)] text-4xl font-black italic">
                {(user.name?.[0] || user.email[0]).toUpperCase()}
              </div>
            )}

            {isOwnProfile && !isGuest && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]">
                {repositionMode === 'avatar' ? (
                  <Move className="w-8 h-8 text-white animate-pulse" />
                ) : (
                  <button onClick={onAvatarClick} className="text-white hover:scale-110 transition-transform">
                    {uploadingAvatar ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
                  </button>
                )}
              </div>
            )}
          </div>
          
          {isOwnProfile && !isGuest && (
            <button 
              onClick={() => repositionMode === 'avatar' ? savePosition() : setRepositionMode('avatar')}
              className={clsx(
                "absolute -bottom-3 -right-3 p-3 rounded-xl shadow-lg transition-transform hover:scale-110",
                repositionMode === 'avatar' ? "bg-emerald-500 text-white" : "glass-card bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]"
              )}
              title="Reposition Avatar"
            >
              {repositionMode === 'avatar' ? <CheckCircle className="w-4 h-4" /> : <Move className="w-4 h-4" />}
            </button>
          )}
        </div>
        
        <div className="pb-20 flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tight mb-1 flex items-center gap-3">
              {user.name || user.email.split('@')[0]}
              <span className={clsx(
                "text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest font-black border",
                user.role === 'ADMIN' ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : 
                user.role === 'GUEST' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                "bg-blue-500/20 text-blue-400 border-blue-500/30"
              )}>
                {user.role}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[var(--muted)] text-sm font-medium">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
              {user.address && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {user.address}</span>}
              {user.education && <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {user.education}</span>}
              <span className="hidden sm:flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Member since {new Date(user.createdAt).getFullYear()}</span>
            </div>
            
            <div className="flex gap-6 mt-4">
              <div className="flex flex-col">
                <span className="text-xl font-black text-[var(--foreground)]">{user._count?.followers || 0}</span>
                <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-[var(--foreground)]">{user._count?.following || 0}</span>
                <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Following</span>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="flex items-center gap-3">
               <button 
                onClick={onFollow}
                disabled={loadingFollow}
                className={clsx(
                   "px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:-translate-y-0.5 active:scale-95",
                   isFollowing ? "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                )}
              >
                {loadingFollow ? <Loader2 className="w-5 h-5 animate-spin" /> : isFollowing ? 'Following' : 'Follow'}
              </button>
              <button 
                onClick={() => navigate(`/chat?user=${user.id}`)}
                className="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--card-hover)] px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <MessageSquare className="w-5 h-5" />
                Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
