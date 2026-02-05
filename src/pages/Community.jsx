
import { Image as ImageIcon, Loader2, Send, ShieldAlert, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MOCK_POSTS_SETS, getSeededSet } from '../lib/guestMockData';
import { compressImage } from '../lib/imageOptimizer';

const POSTS_PER_PAGE = 10;

export default function Community() {
  const { user, guestDataSeed } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPosts, setFetchingPosts] = useState(false);
  const fileInputRef = useRef(null);
  const observer = useRef();
  
  const isGuest = user?.role === 'GUEST';
  const guestPosts = useMemo(() => isGuest ? getSeededSet(MOCK_POSTS_SETS, guestDataSeed) : [], [isGuest, guestDataSeed]);

  const lastPostElementRef = useCallback(node => {
    if (fetchingPosts) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [fetchingPosts, hasMore]);

  const fetchPosts = async (pageNum, isInitial = false) => {
    if (isGuest) {
        setPosts(guestPosts);
        setHasMore(false);
        return;
    }
    if (fetchingPosts) return;
    setFetchingPosts(true);
    try {
      const res = await api.get(`/posts?page=${pageNum}&limit=${POSTS_PER_PAGE}`);
      const newPosts = res.data;
      
      if (isInitial) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      }
      
      if (newPosts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, true);
  }, []);

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page);
    }
  }, [page]);

  const refreshFeed = () => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  };

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
  }, [posts.length, window.location.hash]);

  const handleFileChange = async (e) => {
      if (isGuest) return toast.error("Observation Mode: Upload restricted.");
      const file = e.target.files?.[0];
      if (file) {
          setImagePreview(URL.createObjectURL(file));
          try {
              const compressed = await compressImage(file);
              setImageFile(compressed);
          } catch (err) {
              console.error('Compression failed', err);
              setImageFile(file);
          }
      }
  };

  const clearImage = () => {
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createPost = async () => {
    if (isGuest) return toast.error("Observation Mode: Posting restricted.");
    if (!content.trim() && !imageFile) return;
    
    // Optimistic Update
    const tempId = Date.now().toString();
    const optimisticPost = {
        id: tempId,
        content: content,
        imageUrl: imagePreview,
        createdAt: new Date().toISOString(),
        user: user,
        _count: { comments: 0, shares: 0 },
        reactions: [],
        comments: [],
        isOptimistic: true
    };

    setPosts(prev => [optimisticPost, ...prev]);
    setContent('');
    const currentImageFile = imageFile;
    clearImage();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', optimisticPost.content);
      if (currentImageFile) {
          formData.append('file', currentImageFile);
      }

      const res = await api.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setPosts(prev => prev.map(p => p.id === tempId ? res.data : p));
    } catch (err) {
      toast.error('Failed to post');
      setPosts(prev => prev.filter(p => p.id !== tempId));
      setContent(optimisticPost.content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight italic">
            Community <span className="text-blue-500">Hub</span>
        </h1>
        {fetchingPosts && page === 1 && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
      </div>
      
      {/* Create Post Interface */}
      <div className="glass-card p-4 space-y-4 relative group">
        {isGuest && (
            <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                <div className="bg-amber-500/20 border border-amber-500/30 px-6 py-3 rounded-2xl flex items-center gap-3 animate-in zoom-in">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-500">Guest Restriction Protocol</span>
                </div>
            </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Spread your transmission..."
          disabled={isGuest}
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] resize-none disabled:opacity-50"
        />
        
        {imagePreview && (
            <div className="relative">
                <img src={imagePreview} alt="Preview" className="max-h-60 rounded-lg border border-[var(--border)] object-cover" />
                <button onClick={clearImage} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white no-underline">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}

        <div className="flex justify-between items-center border-t border-[var(--border)] pt-4">
            <button 
                onClick={() => !isGuest && fileInputRef.current?.click()} 
                disabled={isGuest}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-bold disabled:opacity-30"
            >
                <ImageIcon className="w-5 h-5" />
                <span>Media Payload</span>
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
                disabled={loading || isGuest || (!content.trim() && !imageFile)}
                className="premium-gradient text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Transmitting...' : 'Transmit'}
            </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {posts.length === 0 && fetchingPosts ? (
            <div className="space-y-6">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
            </div>
        ) : (
            <>
                {posts.map((post, index) => {
                  if (posts.length === index + 1) {
                    return (
                      <div ref={lastPostElementRef} key={post.id} id={`post-${post.id}`}>
                        <PostCard post={post} onUpdate={refreshFeed} currentUser={user} />
                      </div>
                    );
                  } else {
                    return (
                      <div key={post.id} id={`post-${post.id}`}>
                        <PostCard post={post} onUpdate={refreshFeed} currentUser={user} />
                      </div>
                    );
                  }
                })}
            </>
        )}
        
        {fetchingPosts && page > 1 && (
            <div className="space-y-6">
                <PostSkeleton />
            </div>
        )}
        
        {!hasMore && posts.length > 0 && (
            <p className="text-center text-[var(--muted)] py-4 italic text-sm font-black uppercase tracking-widest">End of signal stream.</p>
        )}
      </div>
    </div>
  );
}
