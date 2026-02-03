
import clsx from 'clsx';
import { Calendar, Camera, CheckCircle, FileText, Image as ImageIcon, Loader2, Mail, MessageSquare, Move, Save, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUserInfo } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Repositioning state
  const [repositionMode, setRepositionMode] = useState<'avatar' | 'cover' | null>(null);
  const [tempPos, setTempPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, initialX: 50, initialY: 50 });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !id || id === currentUser?.id;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const targetId = id || 'profile';
      const res = await api.get(`/users/${targetId === 'profile' ? 'profile' : targetId}`);
      setUser(res.data);
      setBio(res.data.bio || '');
      if (isOwnProfile) {
          updateUserInfo({ avatarUrl: res.data.avatarUrl });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
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
  const handleMouseDown = (e: React.MouseEvent, type: 'avatar' | 'cover') => {
      if (repositionMode !== type) return;
      setIsDragging(true);
      const currentPos = type === 'cover' ? (user.coverPosition || { x: 50, y: 50 }) : (user.avatarPosition || { x: 50, y: 50 });
      dragStart.current = { 
          x: e.clientX, 
          y: e.clientY, 
          initialX: tempPos.x,
          initialY: tempPos.y 
      };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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

  const startReposition = (type: 'avatar' | 'cover') => {
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
  if (!user) return <div className="text-center py-20 text-slate-400">User not found</div>;

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
                "h-72 rounded-3xl bg-slate-900 overflow-hidden relative shadow-2xl border border-white/5 transition-all",
                repositionMode === 'cover' ? "cursor-move ring-4 ring-blue-500/50" : ""
            )}
            onMouseDown={(e) => handleMouseDown(e, 'cover')}
        >
            {user.coverImageUrl ? (
                <img 
                    src={user.coverImageUrl} 
                    alt="Cover" 
                    draggable={false}
                    className="w-full h-full object-cover select-none" 
                    style={{ objectPosition: currentCoverPos }}
                />
            ) : (
                <div className="w-full h-full premium-gradient opacity-40"></div>
            )}
            
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            {isOwnProfile && !repositionMode && (
                <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                        onClick={() => startReposition('cover')}
                        className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-2xl text-white transition-all flex items-center gap-2 border border-white/10"
                    >
                        <Move className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-2xl text-white transition-all flex items-center gap-2 border border-white/10"
                    >
                        {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4" />}
                        <span className="text-xs font-bold uppercase tracking-wider">Change</span>
                    </button>
                </div>
            )}

            {repositionMode === 'cover' && (
                <div className="absolute top-4 right-4 flex gap-2 animate-in slide-in-from-right-4">
                    <button onClick={savePosition} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-xl border border-white/10">
                        <Save className="w-4 h-4" /> Save Position
                    </button>
                    <button onClick={() => setRepositionMode(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md border border-white/10">
                        <X className="w-4 h-4" /> Cancel
                    </button>
                </div>
            )}
            
            {repositionMode === 'cover' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="px-4 py-2 bg-black/60 backdrop-blur-lg rounded-full text-white/70 text-[10px] uppercase font-black tracking-[0.2em] border border-white/5 shadow-2xl">
                        Drag to adjust cover position
                    </div>
                </div>
            )}
        </div>
        
        {/* Profile Info Overlay */}
        <div className="absolute -bottom-20 left-8 flex items-end gap-6 w-full">
            <div className="relative group/avatar">
                <div 
                    className={clsx(
                        "w-44 h-44 rounded-full bg-slate-900 border-[6px] border-[#030712] shadow-2xl overflow-hidden flex items-center justify-center relative transition-all",
                        repositionMode === 'avatar' ? "cursor-move ring-4 ring-blue-500/50" : ""
                    )}
                    onMouseDown={(e) => handleMouseDown(e, 'avatar')}
                >
                    {user.avatarUrl ? (
                        <img 
                            src={user.avatarUrl} 
                            alt="Avatar" 
                            draggable={false}
                            className="w-full h-full object-cover select-none" 
                            style={{ objectPosition: currentAvatarPos }}
                        />
                    ) : (
                        <span className="text-7xl font-black text-white">{user.email[0].toUpperCase()}</span>
                    )}
                    
                    {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}

                    {repositionMode === 'avatar' && (
                        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                             <Move className="w-8 h-8 text-white/50" />
                        </div>
                    )}
                </div>

                {isOwnProfile && !repositionMode && (
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                         <button onClick={() => startReposition('avatar')} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white border border-white/10 transition-all">
                             <Move className="w-5 h-5" />
                         </button>
                         <button onClick={() => avatarInputRef.current?.click()} className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-lg transition-all">
                             <Camera className="w-5 h-5" />
                         </button>
                    </div>
                )}

                {repositionMode === 'avatar' && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-1 animate-in zoom-in duration-200">
                        <button onClick={savePosition} className="p-2 bg-emerald-600 rounded-full text-white shadow-lg"><Save className="w-4 h-4"/></button>
                        <button onClick={() => setRepositionMode(null)} className="p-2 bg-rose-600 rounded-full text-white shadow-lg"><X className="w-4 h-4"/></button>
                    </div>
                )}
            </div>

            <div className="mb-6 pb-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">{user.email.split('@')[0]}</h1>
                    {user.isOnline && (
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.1em]">Online Now</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4 mt-2">
                    <p className="text-blue-400 font-bold tracking-[0.15em] uppercase text-xs flex items-center gap-2 bg-blue-500/5 px-3 py-1 rounded-lg border border-blue-500/10">
                        <CheckCircle className="w-4 h-4" />
                        {user.role} Precision Member
                    </p>
                    <div className="h-4 w-px bg-white/10"></div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Active since {new Date(user.createdAt).getFullYear()}
                    </p>
                </div>
            </div>

            {!isOwnProfile && (
                <button 
                    onClick={() => navigate(`/chat?user=${user.id}`)}
                    className="mb-8 ml-auto mr-16 premium-gradient px-10 py-4 rounded-3xl text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-blue-600/30 active:scale-95 transition-all hover:brightness-110"
                >
                    <MessageSquare className="w-5 h-5" />
                    Secure Message
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-28">
        <div className="space-y-8">
            <div className="glass-card p-8 space-y-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FileText className="w-24 h-24" />
                </div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Biography Structure
                </h3>
                {isEditing ? (
                    <div className="space-y-4">
                        <textarea 
                            value={bio} 
                            onChange={e => setBio(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-inner min-h-[120px] resize-none"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleUpdate} className="flex-1 bg-blue-600 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-500 transition-all"><Save className="w-3 h-3"/> Commit</button>
                            <button onClick={() => setIsEditing(false)} className="flex-1 bg-white/5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-white/10 transition-all">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <p className="text-slate-400 text-sm leading-relaxed font-medium italic border-l-2 border-white/5 pl-4 py-1">
                            {user.bio || "Data stream pending. User bio not yet initialized."}
                        </p>
                        {isOwnProfile && (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:translate-x-1 transition-all">
                                Update Bio Protocol <X className="w-3 h-3 rotate-45" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="glass-card p-8 space-y-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Registry Data
                </h3>
                <div className="space-y-5">
                    <div className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                            <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Primary Sync</p>
                            <p className="text-sm font-bold text-white truncate">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                            <Calendar className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Initialization</p>
                            <p className="text-sm font-bold text-white">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-6">
                <div className="glass-card p-8 flex items-center gap-6 border border-white/5 group hover:bg-blue-500/5 transition-all">
                    <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div>
                        <span className="text-4xl font-black text-white block leading-none">{user._count.posts}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Data Units</span>
                    </div>
                </div>
                <div className="glass-card p-8 flex items-center gap-6 border border-white/5 group hover:bg-purple-500/5 transition-all">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <span className="text-4xl font-black text-white block leading-none">{user._count.tasks}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Resolved Tasks</span>
                    </div>
                </div>
            </div>

            <div className="glass-card border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Recent Transmissions</h3>
                    <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-[10px] font-black tracking-widest">ENCRYPTED</div>
                </div>
                <div className="p-12 text-center text-slate-500 italic text-sm">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-700">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    End-to-end encrypted activity logs are currently restricted.
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
