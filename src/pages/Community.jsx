
import { ChevronDown, ChevronUp, Edit2, Image as ImageIcon, MessageCircle, MoreHorizontal, Send, Share2, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 15000); 
    return () => clearInterval(interval);
  }, []);

  // Handle auto-scrolling to post from hash
  useEffect(() => {
     if (posts.length > 0 && window.location.hash) {
         const id = window.location.hash.replace('#post-', '');
         const element = document.getElementById(`post-${id}`);
         if (element) {
             setTimeout(() => {
                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 element.classList.add('ring-2', 'ring-blue-500/50', 'ring-offset-4', 'ring-offset-[#030712]');
                 setTimeout(() => element.classList.remove('ring-2', 'ring-blue-500/50'), 3000);
             }, 100);
         }
     }
  }, [posts, window.location.hash]);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  const clearImage = () => {
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createPost = async () => {
    if (!content.trim() && !imageFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (imageFile) {
          formData.append('file', imageFile);
      }

      await api.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      setContent('');
      clearImage();
      fetchPosts();
    } catch (err) {
      alert('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700">
      <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Community Feed</h1>
      
      {/* Create Post Interface */}
      <div className="glass-card p-4 space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] resize-none"
        />
        
        {imagePreview && (
            <div className="relative">
                <img src={imagePreview} alt="Preview" className="max-h-60 rounded-lg border border-[var(--border)]" />
                <button onClick={clearImage} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white no-underline">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}

        <div className="flex justify-between items-center border-t border-[var(--border)] pt-4">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-bold">
                <ImageIcon className="w-5 h-5" />
                <span>Photo/Video</span>
            </button>
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden" 
            />

            <button 
                onClick={createPost} 
                disabled={loading || (!content.trim() && !imageFile)}
                className="premium-gradient text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
                <Send className="w-4 h-4" />
                {loading ? 'Posting...' : 'Post'}
            </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} id={`post-${post.id}`}>
            <PostCard post={post} onUpdate={fetchPosts} currentUser={user} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, onUpdate, currentUser }) {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [visibleComments, setVisibleComments] = useState(3);
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
  
  const handleReaction = async (type) => {
      try {
          await api.post(`/posts/${post.id}/react`, { type });
          onUpdate(); 
      } catch (err) {
          console.error(err);
          // alert('Reaction failed');
      }
  };

  const submitComment = async (parentId) => {
      if (!comment.trim() && !parentId) return;
      try {
          await api.post(`/posts/${post.id}/comment`, { content: comment, parentId });
          setComment('');
          onUpdate();
      } catch (err) {
          alert('Comment failed');
      }
  };

  const handleDeletePost = async () => {
    try {
        await api.delete(`/posts/${post.id}`);
        onUpdate();
    } catch (err) {
        alert('Failed to delete post');
    }
  };

  const handleUpdatePost = async (newContent) => {
    try {
        await api.patch(`/posts/${post.id}`, { content: newContent });
        onUpdate();
    } catch (err) {
        alert('Failed to update post');
    }
  };

  const getReactionCount = (type) => post.reactions.filter((r) => r.type === type).length;
  const myReaction = post.reactions.find((r) => r.userId === currentUser?.id)?.type;

  return (
    <div className="glass-card overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
        <Link to={`/profile/${post.user.id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] font-bold border-2 border-transparent group-hover:border-blue-500 transition-all overflow-hidden shrink-0">
            {post.user.avatarUrl ? (
                <img 
                    src={post.user.avatarUrl} 
                    className="w-full h-full object-cover" 
                    style={{ objectPosition: post.user.avatarPosition ? `${post.user.avatarPosition.x}% ${post.user.avatarPosition.y}%` : 'center' }}
                />
            ) : post.user.email[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-[var(--foreground)] group-hover:text-blue-400 transition-colors">{post.user.email.split('@')[0]}</h3>
            <p className="text-xs text-[var(--muted)]">
                {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
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
                    {currentUser?.id === post.userId && (
                        <>
                            <button 
                                onClick={() => {
                                    setShowMenu(false);
                                    const newContent = prompt('Edit your post', post.content);
                                    if (newContent && newContent !== post.content) {
                                        handleUpdatePost(newContent);
                                    }
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Post
                            </button>
                            <button 
                                onClick={() => {
                                    setShowMenu(false);
                                    if (confirm('Are you sure you want to delete this post?')) {
                                        handleDeletePost();
                                    }
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Post
                            </button>
                            <div className="my-1 border-t border-[var(--border)]"></div>
                        </>
                    )}
                    <button 
                        onClick={() => {
                            setShowMenu(false);
                            navigator.clipboard.writeText(`${window.location.origin}/community#post-${post.id}`);
                            alert('Link copied to clipboard!');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                    >
                        <Share2 className="w-4 h-4" /> Share Link
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <p className="text-[var(--foreground)] opacity-90 whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
            <img src={post.imageUrl} alt="Post content" className="w-full rounded-xl border border-[var(--border)]" />
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-[var(--muted)] border-t border-[var(--border)]">
        <div className="flex gap-3">
            <span>{getReactionCount('LIKE')} Likes</span>
            <span>{getReactionCount('LOVE')} Loves</span>
            <span>{getReactionCount('DISLIKE')} Dislikes</span>
        </div>
        <div>
            {post._count.comments} Comments
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-[var(--foreground)]/[0.02]">
        <ReactionButton active={myReaction === 'LIKE'} onClick={() => handleReaction('LIKE')} icon={<ThumbsUp className="w-5 h-5" />} label="Like" />
        <ReactionButton active={myReaction === 'LOVE'} onClick={() => handleReaction('LOVE')} icon={<span className="text-xl">❤️</span>} label="Love" color="text-rose-500" />
        <ReactionButton active={myReaction === 'DISLIKE'} onClick={() => handleReaction('DISLIKE')} icon={<ThumbsDown className="w-5 h-5" />} label="Dislike" />
        <button onClick={() => setShowComments(!showComments)} className="flex items-center justify-center gap-2 py-2 hover:bg-[var(--card-hover)] rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Comment</span>
        </button>
      </div>


      {/* Comments Section */}
      {showComments && (
        <div className="p-4 bg-[var(--background)]/40 border-t border-[var(--border)] space-y-4">
            <div className="space-y-4">
                {post.comments.filter((c) => !c.parentId).slice(0, visibleComments).map((c) => (
                    <CommentItem key={c.id} comment={c} postId={post.id} onReplySuccess={onUpdate} />
                ))}
                
                {post.comments.filter((c) => !c.parentId).length > visibleComments && (
                    <button 
                        onClick={() => setVisibleComments(prev => prev + 5)}
                        className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] w-full text-left pl-2"
                    >
                        View {post.comments.filter((c) => !c.parentId).length - visibleComments} more comments...
                    </button>
                )}
            </div>
            
            <div className="flex gap-2 pt-2">
                <input 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={e => e.key === 'Enter' && submitComment()}
                />
                <button onClick={() => submitComment()} disabled={!comment.trim()} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                </button>
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
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${active ? `bg-[var(--foreground)]/10 ${color}` : "bg-transparent text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"}`}
        >
            {icon}
            <span className={`font-semibold text-sm ${active ? color : "text-[var(--muted)] group-hover:text-[var(--foreground)]"}`}>{label}</span>
        </button>
    )
}

function CommentItem({ comment, postId, onReplySuccess }) {
    const [replying, setReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replyText, setReplyText] = useState('');

    const handleReply = async () => {
        if (!replyText.trim()) return;
        try {
            await api.post(`/posts/${postId}/comment`, { content: replyText, parentId: comment.id });
            setReplyText('');
            setReplying(false);
            setShowReplies(true); // Auto expand on reply
            onReplySuccess();
        } catch {
            alert('Failed to reply');
        }
    };

    return (
        <div className="flex gap-3">
            <Link to={`/profile/${comment.user.id}`} className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-[var(--card)] flex items-center justify-center text-xs font-bold text-[var(--muted)] hover:bg-blue-500/20 transition-colors border border-[var(--border)]">
                    {comment.user.avatarUrl ? <img src={comment.user.avatarUrl} className="w-full h-full object-cover rounded-full" /> : comment.user.email[0].toUpperCase()}
                </div>
            </Link>
            <div className="flex-1 space-y-1">
                <div className="bg-[var(--card)] p-3 rounded-2xl rounded-tl-none inline-block min-w-[200px] border border-[var(--border)]">
                    <Link to={`/profile/${comment.user.id}`} className="text-xs font-bold text-[var(--muted)] mb-1 block hover:text-blue-400 transition-colors">{comment.user.email.split('@')[0]}</Link>
                    <p className="text-sm text-[var(--foreground)] opacity-90">{comment.content}</p>
                </div>
                <div className="flex items-center gap-4 px-2">
                    <button onClick={() => setReplying(!replying)} className="text-xs font-bold text-slate-500 hover:text-blue-400">Reply</button>
                    <span className="text-xs text-slate-600">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                    {comment.replies && comment.replies.length > 0 && (
                        <button onClick={() => setShowReplies(!showReplies)} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1">
                            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {comment.replies.length} Replies
                        </button>
                    )}
                </div>

                {/* Nested Replies */}
                {showReplies && comment.replies && comment.replies.length > 0 && (
                    <div className="pl-4 space-y-2 mt-2 border-l-2 border-white/5 animate-in slide-in-from-top-2">
                         {comment.replies.map((reply) => (
                             <CommentItem key={reply.id} comment={reply} postId={postId} onReplySuccess={onReplySuccess} />
                         ))}
                    </div>
                )}

                {/* Reply Input */}
                {replying && (
                    <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                        <input 
                            value={replyText}
                            autoFocus
                            onChange={e => setReplyText(e.target.value)}
                            className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--foreground)]"
                            placeholder="Write a reply..."
                            onKeyDown={e => e.key === 'Enter' && handleReply()}
                        />
                        <button onClick={handleReply} className="text-xs font-bold text-blue-400">Post</button>
                    </div>
                )}
            </div>
        </div>
    )
}
