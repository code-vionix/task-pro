
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import ProfileBio from '../components/profile/ProfileBio';
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
      />

      {/* 2. Main Layout (Bio & Feed vs Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-20">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Autobiography Section */}
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

          {/* User's Transmission Stream */}
          <ProfilePosts 
            posts={posts}
            fetchingPosts={fetchingPosts}
            page={page}
            hasMore={hasMore}
            lastPostElementRef={lastPostElementRef}
            onRefresh={refreshUserPosts}
            currentUser={currentUser}
          />
        </div>

        {/* Informational Sidebar */}
        <ProfileSidebar user={user} />
      </div>
    </div>
  );
}
