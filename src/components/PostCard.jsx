
import clsx from 'clsx';
import { Edit2, Heart, Loader2, MessageSquare, MoreHorizontal, Send, Share2, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export function PostCard({ post, onUpdate, currentUser }) {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [visibleComments, setVisibleComments] = useState(3);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);
  const [localCommentCount, setLocalCommentCount] = useState(post._count?.comments || 0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showReactorsModal, setShowReactorsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const menuRef = useRef(null);
  const isGuest = currentUser?.role === 'GUEST';

  useEffect(() => {
     setLocalReactions(post.reactions || []);
     setLocalCommentCount(post._count?.comments || 0);
  }, [post.reactions, post._count?.comments]);

  const buildCommentTree = (comments) => {
    const map = {};
    const roots = [];
    comments.forEach(c => {
        map[c.id] = { ...c, replies: [] };
    });
    comments.forEach(c => {
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

  const commentTree = buildCommentTree(post.comments || []);

  useEffect(() => {
    function handleClickOutside(event) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setShowMenu(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleReaction = async (type) => {
      if (isGuest) return toast.error("Guest Mode: Interactions restricted.");
      
      const existingIdx = localReactions.findIndex(r => r.userId === currentUser?.id);
      let newReactions = [...localReactions];
      
      if (existingIdx > -1) {
          if (newReactions[existingIdx].type === type) {
              newReactions.splice(existingIdx, 1);
          } else {
              newReactions[existingIdx] = { ...newReactions[existingIdx], type };
          }
      } else {
          newReactions.push({ 
              userId: currentUser?.id, 
              type, 
              id: 'temp-' + Date.now(),
              user: { id: currentUser.id, email: currentUser.email, avatarUrl: currentUser.avatarUrl }
          });
      }
      
      setLocalReactions(newReactions);

      try {
          await api.post(`/posts/${post.id}/react`, { type });
      } catch (err) {
          console.error(err);
          setLocalReactions(post.reactions);
      }
  };

  const submitComment = async (parentId = null) => {
      if (isGuest) return toast.error("Guest Mode: Commenting restricted.");
      const targetComment = parentId ? '' : comment; 
      if (!targetComment.trim()) return;

      setIsSubmittingComment(true);
      try {
          await api.post(`/posts/${post.id}/comment`, { content: targetComment, parentId });
          setComment('');
          setLocalCommentCount(prev => prev + 1);
          onUpdate(); 
      } catch (err) {
          toast.error('Comment failed');
      } finally {
          setIsSubmittingComment(false);
      }
  };

  const handleDeletePost = async () => {
    if (isGuest) return;
    try {
        await api.delete(`/posts/${post.id}`);
        onUpdate();
        toast.success('Post removed');
    } catch (err) {
        toast.error('Failed to delete post');
    }
  };

  const handleUpdatePost = async (newContent) => {
    if (isGuest) return;
    try {
        await api.patch(`/posts/${post.id}`, { content: newContent });
        onUpdate();
        toast.success('Post updated');
    } catch (err) {
        toast.error('Failed to update post');
    }
  };

  const handleSharePost = async () => {
    if (isGuest) return toast.error("Guest Mode: Sharing restricted.");
    const shareContent = prompt('Say something about this post...');
    if (shareContent === null) return;
    try {
        await api.post(`/posts/${post.id}/share`, { content: shareContent });
        onUpdate();
        toast.success('Post shared');
    } catch (err) {
        toast.error('Failed to share post');
    }
  };

  const getReactionCount = (type) => localReactions.filter((r) => r.type === type).length || 0;
  const myReaction = localReactions.find((r) => r.userId === currentUser?.id)?.type;

  const getReactorsByType = (type) => {
      if (type === 'ALL') return localReactions;
      return localReactions.filter(r => r.type === type);
  };

  return (
    <div className={`glass-card overflow-hidden transition-all duration-300 ${post.isOptimistic ? 'opacity-70 grayscale-[0.5]' : 'opacity-100'} hover:shadow-xl hover:shadow-blue-500/5 group/card relative`}>
      {/* Header */}
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
                                            handleUpdatePost(newContent);
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
                                         handleDeletePost();
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
                            handleSharePost();
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

      {/* Content */}
      <div className="p-4 space-y-4">
        {post.content && <p className="text-[var(--foreground)] opacity-90 whitespace-pre-wrap leading-relaxed text-sm font-medium">{post.content}</p>}
        {post.imageUrl && (
            <div className={`relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] group/img`}>
                <div className={clsx(
                    "absolute inset-0 skeleton flex items-center justify-center bg-[var(--card-hover)] z-0 transition-opacity duration-1000",
                    imageLoaded ? "opacity-0 invisible" : "opacity-100 visible"
                )}>
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500/20" />
                </div>
                <img 
                    src={post.imageUrl} 
                    alt="Post content" 
                    className={clsx(
                        "w-full h-auto object-cover max-h-[600px] transition-all duration-1000 ease-out",
                        imageLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.02] blur-xl"
                    )} 
                    onLoad={() => setImageLoaded(true)}
                    loading="lazy"
                />
                {imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none" />
                )}
            </div>
        )}

        {/* Shared Post Container */}
        {post.sharedPost && (
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--card)] group-hover/card:border-blue-500/30 transition-colors mt-4">
                <div className="p-3 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--foreground)]/[0.02]">
                    <div className="w-7 h-7 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] text-[10px] font-bold border border-[var(--border)] overflow-hidden shrink-0">
                        {post.sharedPost.user.avatarUrl ? (
                            <img src={post.sharedPost.user.avatarUrl} className="w-full h-full object-cover" style={{ objectPosition: post.sharedPost.user.avatarPosition ? `${post.sharedPost.user.avatarPosition.x}% ${post.sharedPost.user.avatarPosition.y}%` : 'center' }} loading="lazy" />
                        ) : post.sharedPost.user.email[0].toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-[var(--foreground)]">{post.sharedPost.user.email.split('@')[0]}</h4>
                        <p className="text-[8px] uppercase font-bold text-[var(--muted)]">{new Date(post.sharedPost.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    {post.sharedPost.content && <p className="text-xs text-[var(--foreground)] opacity-80 whitespace-pre-wrap leading-relaxed">{post.sharedPost.content}</p>}
                    {post.sharedPost.imageUrl && (
                        <img src={post.sharedPost.imageUrl} alt="Shared content" className="w-full rounded-lg border border-[var(--border)] shadow-sm" loading="lazy" />
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--muted)] border-t border-[var(--border)] bg-[var(--foreground)]/[0.01]">
        <div 
            className="flex gap-4 cursor-pointer hover:underline text-blue-500/70"
            onClick={() => setShowReactorsModal(true)}
        >
            {getReactionCount('LIKE') > 0 && (
                 <div className="flex items-center gap-1 group/stat relative">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{getReactionCount('LIKE')}</span>
                 </div>
            )}
            {getReactionCount('LOVE') > 0 && (
                 <div className="flex items-center gap-1 group/stat relative">
                    <Heart className="w-3 h-3 fill-rose-500/50" />
                    <span>{getReactionCount('LOVE')}</span>
                 </div>
            )}
            {getReactionCount('DISLIKE') > 0 && (
                 <div className="flex items-center gap-1 group/stat relative">
                    <ThumbsDown className="w-3 h-3" />
                    <span>{getReactionCount('DISLIKE')}</span>
                 </div>
            )}
        </div>
        <div className="flex gap-4">
            <span>{post._count?.shares || 0} shares</span>
            <button onClick={() => setShowComments(!showComments)} className="hover:text-blue-400 transition-colors">
                {localCommentCount} comments
            </button>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-[var(--foreground)]/[0.03]">
        <ReactionButton active={myReaction === 'LIKE'} onClick={() => handleReaction('LIKE')} icon={<ThumbsUp className="w-5 h-5" />} label="Like" />
        <ReactionButton active={myReaction === 'LOVE'} onClick={() => handleReaction('LOVE')} icon={<Heart className="w-5 h-5" fill={myReaction === 'LOVE' ? 'currentColor' : 'none'} />} label="Love" color="text-rose-500" />
        <ReactionButton active={myReaction === 'DISLIKE'} onClick={() => handleReaction('DISLIKE')} icon={<ThumbsDown className="w-5 h-5" />} label="Dislike" />
        <button 
            onClick={() => setShowComments(!showComments)} 
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${showComments ? 'bg-blue-500/10 text-blue-400' : 'text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]'}`}
        >
            <MessageSquare className="w-5 h-5" />
            <span className="font-bold text-sm">Comment</span>
        </button>
      </div>

      {/* Reactors Modal */}
      {showReactorsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="glass-card w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card)]">
                      <h3 className="font-black uppercase tracking-widest text-[var(--foreground)] text-xs italic">Reactions</h3>
                      <button onClick={() => setShowReactorsModal(false)} className="p-1 hover:bg-[var(--border)] rounded-full text-[var(--muted)]">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="flex border-b border-[var(--border)] bg-[var(--card)]/50">
                      {['ALL', 'LIKE', 'LOVE', 'DISLIKE'].map(type => (
                          <button 
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={clsx(
                                "flex-1 py-3 text-[9px] font-black uppercase tracking-tighter transition-all",
                                activeTab === type ? "text-blue-500 border-b-2 border-blue-500 bg-blue-500/5 shadows-inner" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            )}
                          >
                              {type === 'ALL' ? 'Total' : type === 'LIKE' ? '👍' : type === 'LOVE' ? '❤️' : '👎'}
                              {` (${getReactorsByType(type).length})`}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-black/5">
                      {getReactorsByType(activeTab).map(r => (
                          <div key={r.id} className="flex items-center gap-3 p-3 hover:bg-[var(--card-hover)] rounded-xl transition-all border border-transparent hover:border-[var(--border)] group/item">
                              <div className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] overflow-hidden shrink-0 shadow-sm group-hover/item:border-blue-500/50 transition-colors">
                                  {r.user.avatarUrl ? <img src={r.user.avatarUrl} className="w-full h-full object-cover" /> : r.user.email[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                  <p className="text-[11px] font-black text-[var(--foreground)] truncate uppercase tracking-tight italic">{r.user.email.split('@')[0]}</p>
                              </div>
                              <span className="text-sm">
                                  {r.type === 'LIKE' ? '👍' : r.type === 'LOVE' ? '❤️' : '👎'}
                              </span>
                          </div>
                      ))}
                      {getReactorsByType(activeTab).length === 0 && (
                          <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">No reactions yet</p>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="p-4 bg-[var(--background)]/60 border-t border-[var(--border)] space-y-6 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-4">
                {commentTree.length === 0 ? (
                    <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] py-6 border border-dashed border-[var(--border)] rounded-2xl">No comments yet.</p>
                ) : (
                    <>
                        {commentTree.slice(0, visibleComments).map((c) => (
                            <CommentItem key={c.id} comment={c} postId={post.id} onReplySuccess={onUpdate} currentUser={currentUser} />
                        ))}
                        
                        {commentTree.length > visibleComments && (
                            <button 
                                onClick={() => setVisibleComments(prev => prev + 5)}
                                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 w-full text-center py-3 bg-blue-500/5 rounded-xl border border-blue-500/10 transition-all"
                            >
                                Loading {commentTree.length - visibleComments} more comments
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
                        onKeyDown={e => e.key === 'Enter' && submitComment()}
                    />
                    <button 
                        onClick={() => submitComment()} 
                        disabled={!comment.trim() || isSubmittingComment || isGuest} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg disabled:opacity-50 transition-all"
                    >
                        {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function ReactionButton({ active, onClick, icon, label, color = "text-blue-500" }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all duration-200 group/btn ${active ? `bg-[var(--foreground)]/10 ${color} scale-105 shadow-sm` : "bg-transparent text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"}`}
        >
            <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover/btn:scale-110'}`}>
                {icon}
            </div>
            <span className={`font-bold text-xs uppercase tracking-tight ${active ? color : "text-[var(--muted)] group-hover/btn:text-[var(--foreground)]"}`}>{label}</span>
        </button>
    )
}

function CommentItem({ comment, postId, onReplySuccess, currentUser }) {
    const [replying, setReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isGuest = currentUser?.role === 'GUEST';

    const handleReply = async () => {
        if (isGuest) return toast.error("Observation Mode: Reply restricted.");
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            await api.post(`/posts/${postId}/comment`, { content: replyText, parentId: comment.id });
            setReplyText('');
            setReplying(false);
            setShowReplies(true);
            onReplySuccess();
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
                             <CommentItem key={reply.id} comment={reply} postId={postId} onReplySuccess={onReplySuccess} currentUser={currentUser} />
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
    )
}
