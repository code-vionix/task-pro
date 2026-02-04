
import clsx from 'clsx';
import { Calendar, Camera, CheckCircle, FileText, Loader2, Mail, MessageSquare, Move, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';


export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUserInfo } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Repositioning state
  const [repositionMode, setRepositionMode] = useState(null);
  const [tempPos, setTempPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, initialX: 50, initialY: 50 });

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const isOwnProfile = !id || id === currentUser?.id;

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const targetId = id || 'profile';
      const res = await api.get(`/users/${targetId === 'profile' ? 'profile' : targetId}`);
      setUser(res.data);
      setBio(res.data.bio || '');
      if (isOwnProfile) {
          updateUserInfo({ avatarUrl: res.data.avatarUrl, avatarPosition: res.data.avatarPosition });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
      try {
          const targetId = id || currentUser?.id;
          if (!targetId) return;
          const res = await api.get(`/posts/user/${targetId}`);
          setPosts(res.data);
      } catch (err) {
          console.error('Failed to fetch user posts', err);
      }
  };

  const handleUpdate = async () => {
    try {
      await api.patch('/users/profile', { bio });
      setIsEditing(false);
      fetchProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const setLoadingState = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
    const endpoint = type === 'avatar' ? '/users/upload-avatar' : '/users/upload-cover';

    setLoadingState(true);
    try {
      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchProfile();
      toast.success(`${type === 'avatar' ? 'Profile picture' : 'Cover image'} updated`);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setLoadingState(false);
    }
  };

  // Drag logic
  const handleMouseDown = (e, type) => {
      if (repositionMode !== type) return;
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
      
      const dx = (e.clientX - dragStart.current.x) / 5; // Sensitivity
      const dy = (e.clientY - dragStart.current.y) / 5;

      setTempPos({
          x: Math.max(0, Math.min(100, dragStart.current.initialX - dx)),
          y: Math.max(0, Math.min(100, dragStart.current.initialY - dy))
      });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const startReposition = (type) => {
      const pos = type === 'cover' ? (user.coverPosition || { x: 50, y: 50 }) : (user.avatarPosition || { x: 50, y: 50 });
      setTempPos(pos);
      setRepositionMode(type);
  };

  const savePosition = async () => {
      try {
          const field = repositionMode === 'cover' ? 'coverPosition' : 'avatarPosition';
          await api.patch('/users/profile', { [field]: tempPos });
          setUser({ ...user, [field]: tempPos });
          setRepositionMode(null);
          toast.success('Position saved');
      } catch (err) {
          toast.error('Failed to save position');
      }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <div className="text-center py-20 text-[var(--muted)]">User not found</div>;

  const currentCoverPos = repositionMode === 'cover' ? `${tempPos.x}% ${tempPos.y}%` : 
                          user.coverPosition ? `${user.coverPosition.x}% ${user.coverPosition.y}%` : 'center';
                          
  const currentAvatarPos = repositionMode === 'avatar' ? `${tempPos.x}% ${tempPos.y}%` : 
                           user.avatarPosition ? `${user.avatarPosition.x}% ${user.avatarPosition.y}%` : 'center';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />

      {/* Header / Banner */}
      <div className="relative group">
        <div 
            className={clsx(
                "h-72 rounded-3xl bg-[var(--card)] overflow-hidden relative shadow-2xl border border-[var(--border)] transition-all",
                repositionMode === 'cover' ? "cursor-move ring-4 ring-blue-500/50" : "group-hover:border-[var(--primary)]/30"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'cover')}
        >
            {user.coverImageUrl ? (
                <img 
                    src={user.coverImageUrl} 
                    alt="Cover" 
                    draggable={false}
                    className={clsx("w-full h-full object-cover transition-transform duration-700", !repositionMode && "group-hover:scale-105")}
                    style={{ objectPosition: currentCoverPos }}
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
                     <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/90 via-transparent to-transparent"></div>
        </div>

        {/* Action Buttons (Cover) */}
        {isOwnProfile && (
             <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 {repositionMode === 'cover' ? (
                     <button onClick={savePosition} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in zoom-in">
                         <CheckCircle className="w-4 h-4" /> Save Position
                     </button>
                 ) : (
                    <>
                        <button onClick={() => startReposition('cover')} className="glass-card hover:bg-white/10 text-white p-2 rounded-xl backdrop-blur-md" title="Reposition">
                            <Move className="w-5 h-5" />
                        </button>
                        <button onClick={() => coverInputRef.current?.click()} className="glass-card hover:bg-white/10 text-white p-2 rounded-xl backdrop-blur-md">
                            {uploadingCover ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                        </button>
                    </>
                 )}
             </div>
        )}

        {/* Profile Info Overlay */}
        <div className="absolute -bottom-16 left-8 flex items-end gap-6 w-[calc(100%-4rem)]">
            <div className="relative group/avatar">
                <div 
                    className={clsx(
                        "w-36 h-36 rounded-3xl border-4 border-[var(--background)] overflow-hidden shadow-2xl relative bg-[var(--card)]",
                         repositionMode === 'avatar' ? "cursor-move ring-4 ring-emerald-500/50" : ""
                    )}
                    onMouseDown={(e) => handleMouseDown(e, 'avatar')}
                >
                    {user.avatarUrl ? (
                         <img 
                            src={user.avatarUrl} 
                            alt="Avatar" 
                            draggable={false}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: currentAvatarPos }}
                         />
                    ) : (
                         <div className="w-full h-full flex items-center justify-center bg-[var(--card)] text-[var(--foreground)] text-4xl font-black">
                             {user.email[0].toUpperCase()}
                         </div>
                    )}

                     {isOwnProfile && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]">
                             {repositionMode === 'avatar' ? (
                                 <Move className="w-8 h-8 text-white animate-pulse" />
                             ) : (
                                 <button onClick={() => avatarInputRef.current?.click()} className="text-white hover:scale-110 transition-transform">
                                     {uploadingAvatar ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
                                 </button>
                             )}
                        </div>
                     )}
                </div>
                 
                 {isOwnProfile && (
                    <button 
                         onClick={() => repositionMode === 'avatar' ? savePosition() : startReposition('avatar')}
                         className={clsx(
                             "absolute -bottom-3 -right-3 p-3 rounded-xl shadow-lg transition-transform hover:scale-110",
                             repositionMode === 'avatar' ? "bg-emerald-500 text-white" : "glass-card bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]"
                         )}
                         title="Reposition Avatar"
                    >
                        {repositionMode === 'avatar' ? <CheckCircle className="w-4 h-4" /> : <Move className="w-4 h-4" />}
                    </button>
                 )}
            </div>
            
            <div className="pb-20 flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                 <div>
                    <h1 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tight mb-1 flex items-center gap-3">
                        {user.email.split('@')[0]}
                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-lg uppercase tracking-widest font-bold border border-blue-500/30">
                            {user.role}
                        </span>
                    </h1>
                    <div className="flex items-center gap-4 text-[var(--muted)] text-sm font-medium">
                        <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
                        <span className="hidden sm:flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                 </div>

                 {!isOwnProfile && (
                     <button 
                        onClick={() => navigate(`/chat?user=${user.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                     >
                         <MessageSquare className="w-5 h-5" />
                         Message
                     </button>
                 )}
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-20">
          <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <div className="glass-card p-8 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3 text-purple-400">
                          <FileText className="w-6 h-6" />
                          <h2 className="text-xl font-bold text-[var(--foreground)]">About</h2>
                      </div>
                      {isOwnProfile && !isEditing && (
                          <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] uppercase tracking-widest hover:underline">Edit Bio</button>
                      )}
                  </div>
                  
                  {isEditing ? (
                      <div className="space-y-4 animate-in fade-in">
                          <textarea 
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[150px]"
                              placeholder="Tell us about your mission..."
                          />
                          <div className="flex justify-end gap-3">
                              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--foreground)]">Cancel</button>
                              <button onClick={handleUpdate} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                                  <Save className="w-4 h-4" /> Save
                              </button>
                          </div>
                      </div>
                  ) : (
                      <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap relative z-10">
                          {bio || <span className="text-[var(--muted)] italic">No dossier available.</span>}
                      </p>
                  )}
              </div>

              {/* Activity Feed */}
              <div className="space-y-6">
                   <h2 className="text-xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-3">
                       <MessageSquare className="w-6 h-6 text-blue-400" />
                       Timeline
                   </h2>
                   
                   {posts.length === 0 ? (
                        <div className="glass-card p-10 text-center">
                            <p className="text-[var(--muted)]">No posts to show yet.</p>
                        </div>
                   ) : (
                       <div className="space-y-6">
                           {posts.map(post => (
                               <PostCard key={post.id} post={post} onUpdate={fetchUserPosts} currentUser={currentUser} />
                           ))}
                       </div>
                   )}
              </div>
          </div>

          <div className="space-y-6">
              {/* Stats / Sidebar */}
              <div className="glass-card p-6 space-y-6">
                  <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Performance Metrics</h3>
                  
                  <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 hover:bg-[var(--card-hover)] rounded-xl transition-colors">
                          <span className="text-sm font-bold text-[var(--foreground)]">Task Completion</span>
                          <span className="text-emerald-400 font-mono font-bold">98%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-[var(--card-hover)] rounded-xl transition-colors">
                          <span className="text-sm font-bold text-[var(--foreground)]">Efficiency Score</span>
                          <span className="text-blue-400 font-mono font-bold">A+</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-[var(--card-hover)] rounded-xl transition-colors">
                          <span className="text-sm font-bold text-[var(--foreground)]">Reputation</span>
                          <span className="text-purple-400 font-mono font-bold">Elite</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
