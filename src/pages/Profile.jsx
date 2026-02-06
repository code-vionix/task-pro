
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import CategoryManager from '../components/profile/CategoryManager';
import ProfileBio from '../components/profile/ProfileBio';
import ProfileFollowList from '../components/profile/ProfileFollowList';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfilePosts from '../components/profile/ProfilePosts';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { compressImage } from '../lib/imageOptimizer';

/**
 * Profile Page
 * Refactored into a modular architecture using sub-components.
 * Manages user profile data, image uploads, and an infinite-scrolling personal post feed.
 */
export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUserInfo } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const isGuest = currentUser?.role === 'GUEST';
  const isOwnProfile = !id || id === currentUser?.id;

  // Image Repositioning Logic
  const [repositionMode, setRepositionMode] = useState(null);
  const [tempPos, setTempPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, initialX: 50, initialY: 50 });

  // Pagination Logic
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingPosts, setFetchingPosts] = useState(false);
  const observer = useRef();

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    refreshUserPosts();
    setActiveTab('posts');
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const targetId = id || 'profile';
      const res = await api.get(`/users/${targetId === 'profile' ? 'profile' : targetId}`);
      setUser(res.data);
      setBio(res.data.bio || '');
      if (isOwnProfile && !isGuest) {
          updateUserInfo(res.data);
      }
      
      // Check follow status if viewing someone else
      if (!isOwnProfile && currentUser && !isGuest) {
         fetchFollowStatus(targetId);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      toast.error('Identity not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (pageNum, isInitial = false) => {
      const targetId = id || currentUser?.id;
      if (!targetId || fetchingPosts) return;

      setFetchingPosts(true);
      try {
          const res = await api.get(`/posts/user/${targetId}?page=${pageNum}&limit=10`);
          const newPosts = res.data;
          
          if (isInitial) {
              setPosts(newPosts);
          } else {
              setPosts(prev => {
                  const ids = new Set(prev.map(p => p.id));
                  return [...prev, ...newPosts.filter(p => !ids.has(p.id))];
              });
          }
          if (newPosts.length < 10) setHasMore(false);
      } catch (err) {
          console.error('Failed to fetch user posts:', err);
      } finally {
          setFetchingPosts(false);
      }
  };

  useEffect(() => {
    if (page > 1) fetchUserPosts(page);
  }, [page]);

  const refreshUserPosts = () => {
    setPage(1);
    setHasMore(true);
    fetchUserPosts(1, true);
  };

  const lastPostElementRef = (node) => {
    if (fetchingPosts) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  };

  const handleUpdateBio = async () => {
    if (isGuest) return toast.error("Guest Mode: Restricted action.");
    try {
      await api.patch('/users/profile', { bio });
      setIsEditing(false);
      setUser(prev => ({ ...prev, bio }));
      toast.success('Biography synchronized');
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleFileChange = async (e, type) => {
    if (isGuest) return toast.error("Guest Mode: Upload restricted.");
    const file = e.target.files?.[0];
    if (!file) return;

    const setLoadingState = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
    const endpoint = type === 'avatar' ? '/users/upload-avatar' : '/users/upload-cover';

    setLoadingState(true);
    try {
        const compressed = await compressImage(file, 1500, 1500, 0.8);
        const formData = new FormData();
        formData.append('file', compressed);

        await api.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        fetchProfile();
        toast.success('Visual payload uploaded');
    } catch (err) {
        toast.error('Upload failed');
    } finally {
        setLoadingState(false);
    }
  };

  const handleMouseDown = (e, type) => {
      if (repositionMode !== type || isGuest) return;
      setIsDragging(true);
      dragStart.current = { 
          x: e.clientX, 
          y: e.clientY, 
          initialX: tempPos.x,
          initialY: tempPos.y 
      };
  };

  const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - dragStart.current.x) / 5;
      const dy = (e.clientY - dragStart.current.y) / 5;
      setTempPos({
          x: Math.max(0, Math.min(100, dragStart.current.initialX - dx)),
          y: Math.max(0, Math.min(100, dragStart.current.initialY - dy))
      });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSavePosition = async () => {
    if (isGuest) return;
    try {
        const field = repositionMode === 'cover' ? 'coverPosition' : 'avatarPosition';
        await api.patch('/users/profile', { [field]: tempPos });
        setUser(prev => ({ ...prev, [field]: tempPos }));
        setRepositionMode(null);
        toast.success('Position locked');
    } catch (err) {
        toast.error('Failed to lock position');
    }
  };

  const fetchFollowStatus = async (targetUserId) => {
    try {
        const res = await api.get(`/users/${targetUserId}/followers`);
        const followers = res.data;
        const isFollowing = followers.some(f => f.followerId === currentUser.id);
        setIsFollowing(isFollowing);
    } catch (e) {
        console.error("Failed to fetch follow status", e);
    }
  };

  const handleFollowToggle = async () => {
      if (isGuest) return toast.error("Guest Mode: Restricted.");
      setLoadingFollow(true);
      try {
          if (isFollowing) {
              await api.post(`/users/${user.id}/unfollow`);
              setIsFollowing(false);
              toast.success(`Unfollowed ${user.name || user.email}`);
              setUser(prev => ({ ...prev, _count: { ...prev._count, followers: (prev._count.followers || 1) - 1 } }));
          } else {
              await api.post(`/users/${user.id}/follow`);
              setIsFollowing(true);
              toast.success(`Following ${user.name || user.email}`);
              setUser(prev => ({ ...prev, _count: { ...prev._count, followers: (prev._count.followers || 0) + 1 } }));
          }
      } catch (err) {
          toast.error("Action failed");
      } finally {
          setLoadingFollow(false);
      }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  if (!user) return <div className="text-center py-20 text-[var(--muted)] font-black uppercase tracking-widest">Entity Not Found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      
      {/* Hidden Inputs */}
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />

      {/* 1. Profile Header (Banner & Avatar) */}
      <ProfileHeader 
        user={user}
        isOwnProfile={isOwnProfile}
        isGuest={isGuest}
        onAvatarClick={() => avatarInputRef.current?.click()}
        onCoverClick={() => coverInputRef.current?.click()}
        uploadingAvatar={uploadingAvatar}
        uploadingCover={uploadingCover}
        repositionMode={repositionMode}
        setRepositionMode={setRepositionMode}
        tempPos={tempPos}
        handleMouseDown={handleMouseDown}
        savePosition={handleSavePosition}
        isFollowing={isFollowing}
        onFollow={handleFollowToggle}
        loadingFollow={loadingFollow}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-20">
        <div className="lg:col-span-2 space-y-8">
          <ProfileBio 
            user={user}
            isOwnProfile={isOwnProfile}
            isGuest={isGuest}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            bio={bio}
            setBio={setBio}
            onSave={handleUpdateBio}
          />

          <div className="flex gap-1 p-1 bg-[var(--card)]/50 border border-[var(--border)] rounded-2xl w-fit">
            {[
              { id: 'posts', label: 'Posts' },
              { id: 'followers', label: 'Followers' },
              { id: 'following', label: 'Following' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab.id ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'posts' ? (
            <ProfilePosts 
              posts={posts}
              fetchingPosts={fetchingPosts}
              page={page}
              hasMore={hasMore}
              lastPostElementRef={lastPostElementRef}
              onRefresh={refreshUserPosts}
              currentUser={currentUser}
            />
          ) : (
            <ProfileFollowList 
              userId={user.id} 
              type={activeTab} 
              currentUserId={currentUser?.id} 
            />
          )}
        </div>

        <div className="space-y-8">
          {isOwnProfile && currentUser?.role === 'USER' && (
             <CategoryManager user={user} onUpdate={(updated) => { setUser(updated); updateUserInfo(updated); }} />
          )}
          <ProfileSidebar user={user} />
        </div>
      </div>
    </div>
  );
}
