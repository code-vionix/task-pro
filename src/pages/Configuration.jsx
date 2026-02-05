import clsx from 'clsx';
import { Bell, BellOff, BookOpen, Camera, Globe, Loader2, Lock, MapPin, Save, Settings, User as UserIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../lib/api';

export default function Configuration() {
    const { user, updateUserInfo } = useAuth();
    const { toggleMute, isMuted } = useSocket();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [localMuted, setLocalMuted] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        bio: '',
        address: '',
        education: '',
        email: ''
    });
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                bio: user.bio || '',
                address: user.address || '',
                education: user.education || '',
                email: user.email || ''
            });
        }
    }, [user]);

    useEffect(() => {
        if (isMuted) setLocalMuted(isMuted());
    }, [isMuted]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updateData = { ...profile };
            delete updateData.email; // Email usually readonly
            
            const res = await api.patch('/users/profile/update', updateData);
            updateUserInfo(res.data);
            toast.success("Profile updated successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!passwords.newPassword) return toast.error("Please enter a new password");
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error("Passwords do not match");
        }
        if (passwords.newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        setIsSaving(true);
        try {
            await api.patch('/users/profile/update', { password: passwords.newPassword });
            setPasswords({ newPassword: '', confirmPassword: '' });
            toast.success("Password changed successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update password");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const id = toast.loading("Uploading image...");
        try {
            const res = await api.post('/users/upload-avatar', formData);
            updateUserInfo({ avatarUrl: res.data.url });
            toast.success("Avatar updated!", { id });
        } catch (err) {
            toast.error("Upload failed", { id });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
                <div>
                    <div className="flex items-center gap-3 mb-2 text-blue-500">
                        <Settings className="w-5 h-5 animate-spin-slow" />
                        <span className="text-xs font-black tracking-widest uppercase">Account Settings</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight italic">
                        Account <span className="text-blue-500">Settings</span>
                    </h1>
                    <p className="text-[var(--muted)] mt-2 max-w-lg">
                        Manage your profile and security settings.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Identity */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="glass-card p-8 text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 premium-gradient opacity-30"></div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-6">Visual Identity</h3>
                        
                        <div className="relative inline-block">
                            <div className="w-32 h-32 rounded-[2rem] premium-gradient p-1 shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-500">
                                <div className="w-full h-full rounded-[1.8rem] bg-[var(--card)] overflow-hidden flex items-center justify-center border-2 border-white/10">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} className="w-full h-full object-cover" alt="User" />
                                    ) : (
                                        <UserIcon className="w-12 h-12 text-[var(--muted)]" />
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 p-3 bg-blue-500 text-white rounded-2xl shadow-xl hover:bg-blue-600 transition-all hover:rotate-12"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleAvatarUpload}
                            />
                        </div>

                        <div className="mt-6">
                            <h4 className="text-lg font-bold text-[var(--foreground)] uppercase tracking-tighter">{profile.name || 'Anonymous'}</h4>
                            <p className="text-[10px] text-blue-500 font-black tracking-[0.2em] uppercase mt-1">{user?.role} ACCESS</p>
                        </div>
                    </section>
                </div>

                {/* Profile Data */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="glass-card p-8 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <UserIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tighter">Your Profile</h2>
                                <p className="text-[var(--muted)] text-xs font-bold uppercase tracking-widest">Public Information</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput 
                                    label="Display Name" 
                                    value={profile.name} 
                                    onChange={(v) => setProfile({...profile, name: v})} 
                                    placeholder="Enter your name" 
                                    icon={<UserIcon className="w-4 h-4" />}
                                />
                                <FormInput 
                                    label="Email (Read-only)" 
                                    value={profile.email} 
                                    placeholder="email@example.com" 
                                    disabled 
                                    icon={<Globe className="w-4 h-4" />}
                                />
                            </div>

                            <FormInput 
                                label="Global Bio" 
                                value={profile.bio} 
                                onChange={(v) => setProfile({...profile, bio: v})} 
                                placeholder="Details about you..." 
                                isTextarea
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput 
                                    label="Location / Address" 
                                    value={profile.address} 
                                    onChange={(v) => setProfile({...profile, address: v})} 
                                    placeholder="Sector, City, Galaxy" 
                                    icon={<MapPin className="w-4 h-4" />}
                                />
                                <FormInput 
                                    label="Education / Status" 
                                    value={profile.education} 
                                    onChange={(v) => setProfile({...profile, education: v})} 
                                    placeholder="Academic or Professional background" 
                                    icon={<BookOpen className="w-4 h-4" />}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full premium-gradient text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 uppercase tracking-widest text-[10px]"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Profile
                            </button>
                        </form>
                    </section>

                    {/* Security Section */}
                    <section className="glass-card p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tighter">Security</h2>
                                <p className="text-[var(--muted)] text-xs font-bold uppercase tracking-widest">Change Password</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput 
                                    label="New Password" 
                                    type="password" 
                                    value={passwords.newPassword} 
                                    onChange={(v) => setPasswords({...passwords, newPassword: v})} 
                                    placeholder="••••••••" 
                                />
                                <FormInput 
                                    label="Confirm New Password" 
                                    type="password" 
                                    value={passwords.confirmPassword} 
                                    onChange={(v) => setPasswords({...passwords, confirmPassword: v})} 
                                    placeholder="••••••••" 
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 font-black py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                Update Password
                            </button>
                        </form>
                    </section>

                    {/* Notification Settings */}
                    <section className="glass-card p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Bell className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tighter">Sound Settings</h2>
                                <p className="text-[var(--muted)] text-xs font-bold uppercase tracking-widest">Notifications and Alerts</p>
                            </div>
                        </div>
                        
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={clsx("p-2 rounded-lg transition-colors", localMuted ? "bg-[var(--muted)]/10 text-[var(--muted)]" : "bg-blue-500/10 text-blue-500")}>
                                    {localMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--foreground)]">System Notifications</h4>
                                    <p className="text-xs text-[var(--muted)]">Play sound for new messages and alerts</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                     const newState = toggleMute();
                                     setLocalMuted(newState);
                                     toast(newState ? "Audio Feed Muted" : "Audio Feed Active", { icon: newState ? <BellOff size={16}/> : <Bell size={16}/> });
                                }}
                                className={clsx(
                                    "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none",
                                    localMuted ? "bg-[var(--muted)]/30" : "bg-blue-500"
                                )}
                            >
                                <span 
                                    className={clsx(
                                        "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm",
                                        !localMuted && "translate-x-6"
                                    )}
                                />
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, type = "text", disabled = false, isTextarea = false, icon }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] ml-1">{label}</label>
            <div className="relative group">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-blue-500 transition-colors">{icon}</div>}
                
                {isTextarea ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--foreground)] transition-all font-medium min-h-[120px]"
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange && onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={clsx(
                            "w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--foreground)] transition-all font-medium",
                            icon ? "pl-12 pr-5" : "px-5",
                            disabled && "opacity-50 cursor-not-allowed bg-[var(--border)]/10"
                        )}
                    />
                )}
            </div>
        </div>
    );
}
