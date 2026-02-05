
import { MessageSquare } from 'lucide-react';
import { PostCard } from '../PostCard';
import { PostSkeleton } from '../PostSkeleton';

/**
 * ProfilePosts displays the feed of posts created by the specific user.
 */
export default function ProfilePosts({ 
  posts, 
  fetchingPosts, 
  page, 
  hasMore, 
  lastPostElementRef, 
  onRefresh, 
  currentUser 
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-[var(--foreground)] mb-2 flex items-center gap-3 uppercase italic tracking-tighter">
        <MessageSquare className="w-6 h-6 text-blue-400" />
        Transmission History
      </h2>
      
      {posts.length === 0 && fetchingPosts ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 && !fetchingPosts ? (
        <div className="glass-card p-10 text-center border-dashed border-2 border-[var(--border)] bg-[var(--card)]/30 rounded-[2rem]">
          <p className="text-[var(--muted)] font-black uppercase tracking-[0.2em] text-[10px]">No signals detected from this source.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div ref={posts.length === index + 1 ? lastPostElementRef : null} key={post.id}>
              <PostCard post={post} onUpdate={onRefresh} currentUser={currentUser} />
            </div>
          ))}
          
          {fetchingPosts && page > 1 && (
            <div className="space-y-6">
              <PostSkeleton />
            </div>
          )}
          
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8">
              <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-4" />
              <p className="text-[var(--muted)] italic text-xs font-black uppercase tracking-[0.3em]">End of Stream</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
