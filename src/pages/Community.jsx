
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import CreatePost from '../components/community/CreatePost';
import api from '../lib/api';
import { MOCK_POSTS_SETS, getSeededSet } from '../lib/guestMockData';
import { addPost, setPosts } from '../store/slices/postSlice';

const POSTS_PER_PAGE = 10;

/**
 * Community Hub Page
 * Refactored to use Redux for state management and split into smaller components.
 * Implements infinite scrolling and hash-based deep linking.
 */
export default function Community() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { items: posts } = useSelector(state => state.posts);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingPosts, setFetchingPosts] = useState(false);
  const observer = useRef();
  
  const isGuest = user?.role === 'GUEST';
  const isRestricted = user?.role !== 'ADMIN' && !user?.canUseCommunity;
  
  // Handle guest data seed
  const guestDataSeed = 0; // Can be pulled from context or Redux if needed
  const guestPosts = useMemo(() => isGuest ? getSeededSet(MOCK_POSTS_SETS, guestDataSeed) : [], [isGuest, guestDataSeed]);

  /**
   * Intersection Observer for infinite scrolling.
   * Triggers when the last element enters the viewport.
   */
  const lastPostElementRef = useCallback(node => {
    if (fetchingPosts || isRestricted) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [fetchingPosts, hasMore, isRestricted]);

  const fetchPosts = async (pageNum, isInitial = false) => {
    if (isGuest) {
        dispatch(setPosts(guestPosts));
        setHasMore(false);
        return;
    }
    if (isRestricted) {
        dispatch(setPosts([]));
        setHasMore(false);
        return;
    }
    
    setFetchingPosts(true);
    try {
      const res = await api.get(`/posts?page=${pageNum}&limit=${POSTS_PER_PAGE}`);
      const newPosts = res.data;
      
      if (isInitial) {
        dispatch(setPosts(newPosts));
      } else {
        // Merge unique posts only
        const existingIds = new Set(posts.map(p => p.id));
        const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
        dispatch(setPosts([...posts, ...uniqueNewPosts]));
      }
      
      if (newPosts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setFetchingPosts(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts(1, true);
  }, [isRestricted]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1 && !isRestricted) {
      fetchPosts(page);
    }
  }, [page, isRestricted]);

  // Deep linking scroll
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
  }, [posts.length]);

  const refreshFeed = () => fetchPosts(1, true);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700">
      <header className="flex justify-between items-center bg-transparent">
        <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight italic">
            Community <span className="text-blue-500">Hub</span>
        </h1>
        {fetchingPosts && page === 1 && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
      </header>
      
      {/* 1. Post Creation Interface */}
      <CreatePost 
        user={user} 
        onPostSuccess={(newPost) => dispatch(addPost(newPost))} 
      />

      {/* 2. Feed Stream */}
      <div className="space-y-6">
        {posts.length === 0 && fetchingPosts ? (
            <div className="space-y-6">
                {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
            </div>
        ) : (
            <div className="space-y-6">
                {posts.map((post, index) => (
                    <div 
                      key={post.id} 
                      id={`post-${post.id}`}
                      ref={posts.length === index + 1 ? lastPostElementRef : null}
                    >
                        <PostCard 
                          post={post} 
                          onUpdate={refreshFeed} 
                          currentUser={user} 
                        />
                    </div>
                ))}
            </div>
        )}
        
        {/* Loading indicator for pagination */}
        {fetchingPosts && page > 1 && <PostSkeleton />}
        
        {/* End of Feed Message */}
        {!hasMore && posts.length > 0 && (
            <div className="text-center py-8">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-4" />
                <p className="text-[var(--muted)] italic text-xs font-black uppercase tracking-[0.3em]">
                    End of Transmission
                </p>
            </div>
        )}

        {posts.length === 0 && !fetchingPosts && (
             <div className="text-center py-20 bg-[var(--card)]/30 rounded-[2rem] border border-dashed border-[var(--border)]">
                <p className="text-[var(--muted)] font-medium">No transmissions detected in this frequency.</p>
             </div>
        )}
      </div>
    </div>
  );
}
