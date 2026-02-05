
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import PostActions from './post/PostActions';
import PostComments from './post/PostComments';
import PostContent from './post/PostContent';
import PostHeader from './post/PostHeader';
import PostReactorsModal from './post/PostReactorsModal';

/**
 * PostCard refactored into smaller sub-components for better readability and maintenance.
 * Manages the local state for reactions and comments to provide immediate feedback.
 */
export function PostCard({ post, onUpdate, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);
  const [localCommentCount, setLocalCommentCount] = useState(post._count?.comments || 0);
  const [showReactorsModal, setShowReactorsModal] = useState(false);
  
  const isGuest = currentUser?.role === 'GUEST';

  // Sync local state with post props updates
  useEffect(() => {
     setLocalReactions(post.reactions || []);
     setLocalCommentCount(post._count?.comments || 0);
  }, [post.reactions, post._count?.comments]);

  // Handle reaction logic locally first for speed
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
      setLocalReactions(post.reactions); // Rollback on failure
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

  const myReaction = localReactions.find((r) => r.userId === currentUser?.id)?.type;

  return (
    <div className={`glass-card overflow-hidden transition-all duration-300 ${post.isOptimistic ? 'opacity-70 grayscale-[0.5]' : 'opacity-100'} hover:shadow-xl hover:shadow-blue-500/5 group/card relative`}>
      
      {/* 1. Header with Menu */}
      <PostHeader 
        post={post} 
        currentUser={currentUser} 
        onUpdate={handleUpdatePost} 
        onDelete={handleDeletePost} 
        onShare={handleSharePost}
        isGuest={isGuest}
      />

      {/* 2. Content (Text, Image, Shared Post) */}
      <PostContent post={post} />

      {/* 3. Actions (Reactions & Comment Toggle) */}
      <PostActions 
        localReactions={localReactions}
        myReaction={myReaction}
        onReaction={handleReaction}
        onToggleComments={() => setShowComments(!showComments)}
        showComments={showComments}
        commentCount={localCommentCount}
        shareCount={post._count?.shares}
        onShowReactors={() => setShowReactorsModal(true)}
      />

      {/* 4. Comments Section (Conditional) */}
      {showComments && (
        <PostComments 
          postId={post.id} 
          comments={post.comments} 
          onUpdate={onUpdate} 
          currentUser={currentUser} 
          isGuest={isGuest}
        />
      )}

      {/* 5. Reactors Modal */}
      {showReactorsModal && (
        <PostReactorsModal 
          reactions={localReactions} 
          onClose={() => setShowReactorsModal(false)} 
        />
      )}
    </div>
  );
}
