
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function PostComments({ postId, comments, onUpdate, currentUser, isGuest }) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  const buildCommentTree = (commentsList) => {
    const map = {};
    const roots = [];
    commentsList.forEach(c => {
        map[c.id] = { ...c, replies: [] };
    });
    commentsList.forEach(c => {
        if (c.parentId) {
            if (map[c.parentId]) {
                map[c.parentId].replies.push(map[c.id]);
            }
        } else {
            roots.push(map[c.id]);
        }
    });
    return roots;
  };

  const commentTree = buildCommentTree(comments || []);

  const handlePostComment = async () => {
    if (isGuest) return toast.error("Guest Mode: Commenting restricted.");
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comment`, { content: comment });
      setComment('');
      onUpdate();
    } catch (err) {
      toast.error('Comment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-[var(--background)]/60 border-t border-[var(--border)] space-y-6 animate-in slide-in-from-top-4 duration-300">
      <div className="space-y-4">
        {commentTree.length === 0 ? (
          <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] py-6 border border-dashed border-[var(--border)] rounded-2xl">
            No comments yet.
          </p>
        ) : (
          <>
            {commentTree.slice(0, visibleCount).map((c) => (
              <CommentItem 
                key={c.id} 
                comment={c} 
                postId={postId} 
                onUpdate={onUpdate} 
                currentUser={currentUser} 
                isGuest={isGuest}
              />
            ))}
            
            {commentTree.length > visibleCount && (
              <button 
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 w-full text-center py-3 bg-blue-500/5 rounded-xl border border-blue-500/10 transition-all"
              >
                Loading {commentTree.length - visibleCount} more comments
              </button>
            )}
          </>
        )}
      </div>
      
      <div className="flex gap-3 pt-4 border-t border-[var(--border)] relative">
        <div className="w-8 h-8 rounded-full bg-[var(--card)] flex items-center justify-center overflow-hidden shrink-0 border border-[var(--border)] shadow-sm">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-[var(--muted)]">{currentUser?.email[0].toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 relative">
          <input 
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={isGuest ? "Comments restricted in guest mode" : "Write a comment..."}
            disabled={isGuest}
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-4 pr-12 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
            onKeyDown={e => e.key === 'Enter' && handlePostComment()}
          />
          <button 
            onClick={handlePostComment} 
            disabled={!comment.trim() || isSubmitting || isGuest} 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg disabled:opacity-50 transition-all"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, postId, onUpdate, currentUser, isGuest }) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (isGuest) return toast.error("Observation Mode: Reply restricted.");
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comment`, { content: replyText, parentId: comment.id });
      setReplyText('');
      setReplying(false);
      setShowReplies(true);
      onUpdate();
    } catch {
      toast.error('Failed to reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-3 group/comment">
      <Link to={`/profile/${comment.user.id}`} className="shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-[var(--card)] flex items-center justify-center text-[10px] font-bold text-[var(--muted)] hover:bg-blue-500/20 transition-all border border-[var(--border)] overflow-hidden shadow-sm">
          {comment.user.avatarUrl ? <img src={comment.user.avatarUrl} className="w-full h-full object-cover" loading="lazy" /> : comment.user.email[0].toUpperCase()}
        </div>
      </Link>
      <div className="flex-1 space-y-1.5 min-w-0 text-left">
        <div className="relative">
          <div className="bg-[var(--card)] px-4 py-2.5 rounded-2xl rounded-tl-none border border-[var(--border)] group-hover/comment:border-blue-500/20 transition-colors shadow-sm inline-block max-w-full">
            <Link to={`/profile/${comment.user.id}`} className="text-[10px] font-extrabold text-blue-500 mb-0.5 block hover:underline uppercase tracking-tight italic">{comment.user.email.split('@')[0]}</Link>
            <p className="text-[12px] font-medium text-[var(--foreground)] opacity-90 leading-normal break-words">{comment.content}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-2">
          <button 
            onClick={() => !isGuest ? setReplying(!replying) : toast.error("Guest mode: Access restricted.")} 
            className={`text-[10px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors ${replying ? 'text-blue-400' : 'text-slate-500'}`}
          >
            Reply
          </button>
          <span className="text-[9px] text-slate-600 font-black uppercase">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {comment.replies && comment.replies.length > 0 && (
            <button onClick={() => setShowReplies(!showReplies)} className="text-[10px] font-black uppercase tracking-widest text-blue-500/70 hover:text-blue-500 flex items-center gap-1 transition-colors">
              <span className="w-4 h-[1px] bg-blue-500/30"></span>
              {showReplies ? 'Hide' : `Replies (${comment.replies.length})`}
            </button>
          )}
        </div>

        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="pl-2 space-y-3 mt-3 border-l-2 border-slate-700/30 ml-1 animate-in slide-in-from-left-2 duration-300">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} postId={postId} onUpdate={onUpdate} currentUser={currentUser} isGuest={isGuest} />
            ))}
          </div>
        )}

        {replying && !isGuest && (
          <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex-1 relative">
              <input 
                value={replyText}
                autoFocus
                onChange={e => setReplyText(e.target.value)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Write a reply..."
                onKeyDown={e => e.key === 'Enter' && handleReply()}
              />
              <button 
                onClick={handleReply} 
                disabled={!replyText.trim() || isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-blue-500 hover:text-blue-400 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
