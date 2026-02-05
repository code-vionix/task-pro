
import clsx from 'clsx';
import { Heart, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';

export default function PostActions({ 
  localReactions, 
  myReaction, 
  onReaction, 
  onToggleComments, 
  showComments, 
  commentCount, 
  shareCount,
  onShowReactors 
}) {
  const getReactionCount = (type) => localReactions.filter((r) => r.type === type).length || 0;

  return (
    <>
      {/* Reaction Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--muted)] border-t border-[var(--border)] bg-[var(--foreground)]/[0.01]">
        <div 
          className="flex gap-4 cursor-pointer hover:underline text-blue-500/70"
          onClick={onShowReactors}
        >
          {getReactionCount('LIKE') > 0 && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              <span>{getReactionCount('LIKE')}</span>
            </div>
          )}
          {getReactionCount('LOVE') > 0 && (
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 fill-rose-500/50" />
              <span>{getReactionCount('LOVE')}</span>
            </div>
          )}
          {getReactionCount('DISLIKE') > 0 && (
            <div className="flex items-center gap-1">
              <ThumbsDown className="w-3 h-3" />
              <span>{getReactionCount('DISLIKE')}</span>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <span>{shareCount || 0} shares</span>
          <button onClick={onToggleComments} className="hover:text-blue-400 transition-colors">
            {commentCount} comments
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-[var(--foreground)]/[0.03]">
        <ReactionButton 
          active={myReaction === 'LIKE'} 
          onClick={() => onReaction('LIKE')} 
          icon={<ThumbsUp className="w-5 h-5" />} 
          label="Like" 
        />
        <ReactionButton 
          active={myReaction === 'LOVE'} 
          onClick={() => onReaction('LOVE')} 
          icon={<Heart className="w-5 h-5" fill={myReaction === 'LOVE' ? 'currentColor' : 'none'} />} 
          label="Love" 
          color="text-rose-500" 
        />
        <ReactionButton 
          active={myReaction === 'DISLIKE'} 
          onClick={() => onReaction('DISLIKE')} 
          icon={<ThumbsDown className="w-5 h-5" />} 
          label="Dislike" 
        />
        <button 
          onClick={onToggleComments} 
          className={clsx(
            "flex items-center justify-center gap-2 py-2 rounded-lg transition-all",
            showComments ? 'bg-blue-500/10 text-blue-400' : 'text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]'
          )}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-bold text-sm">Comment</span>
        </button>
      </div>
    </>
  );
}

function ReactionButton({ active, onClick, icon, label, color = "text-blue-500" }) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center gap-2 py-2 rounded-lg transition-all duration-200 group/btn",
        active ? `bg-[var(--foreground)]/10 ${color} scale-105 shadow-sm` : "bg-transparent text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
      )}
    >
      <div className={clsx("transition-transform duration-200", active ? 'scale-110' : 'group-hover/btn:scale-110')}>
        {icon}
      </div>
      <span className={clsx("font-bold text-xs uppercase tracking-tight", active ? color : "text-[var(--muted)] group-hover/btn:text-[var(--foreground)]")}>
        {label}
      </span>
    </button>
  );
}
