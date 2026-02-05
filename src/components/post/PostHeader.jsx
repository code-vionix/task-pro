
import { Edit2, MoreHorizontal, Share2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function PostHeader({ post, currentUser, onUpdate, onDelete, onShare, isGuest }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
      <Link to={`/profile/${post.user.id}`} className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] font-bold border-2 border-transparent group-hover:border-blue-500 transition-all overflow-hidden shrink-0 shadow-inner">
          {post.user.avatarUrl ? (
            <img 
              src={post.user.avatarUrl} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              style={{ objectPosition: post.user.avatarPosition ? `${post.user.avatarPosition.x}% ${post.user.avatarPosition.y}%` : 'center' }}
              loading="lazy"
            />
          ) : post.user.email[0].toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-[var(--foreground)] group-hover:text-blue-400 transition-colors uppercase tracking-tight text-sm italic">{post.user.email.split('@')[0]}</h3>
          <p className="text-[10px] text-[var(--muted)] flex items-center gap-2 font-black uppercase tracking-widest">
            {new Date(post.createdAt).toLocaleDateString()}
            <span className="w-1 h-1 rounded-full bg-blue-500"></span>
            {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </Link>
      
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-slate-500 hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] rounded-full transition-all"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 glass-card bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            {!isGuest && (currentUser?.id === post.userId || currentUser?.role === 'ADMIN') && (
              <>
                {currentUser?.id === post.userId && (
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      const newContent = prompt('Edit your post', post.content);
                      if (newContent && newContent !== post.content) {
                        onUpdate(newContent);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--foreground)] hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Post
                  </button>
                )}
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm('Delete this post?')) {
                      onDelete();
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Post
                </button>
                <div className="my-1 border-t border-[var(--border)]"></div>
              </>
            )}
            <button 
              onClick={() => {
                setShowMenu(false);
                onShare();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--foreground)] hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button 
              onClick={() => {
                setShowMenu(false);
                navigator.clipboard.writeText(`${window.location.origin}/community#post-${post.id}`);
                toast.success('Link copied to clipboard!');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
            >
              <Share2 className="w-4 h-4" /> Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
