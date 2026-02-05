
import { Bell, BellOff, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ProfileDataForm from '../components/config/ProfileDataForm';
import ProfileIdentity from '../components/config/ProfileIdentity';
import SecurityAndAudioSettings from '../components/config/SecurityAndAudioSettings';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../lib/api';

/**
 * Configuration Page
 * Specialized interface for managing personal entity data and security protocols.
 * Modularized for maximum maintainability and clarity.
 */
export default function Configuration() {
    const { user, updateUserInfo } = useAuth();
    const { toggleMute, isMuted } = useSocket();
    const [isSaving, setIsSaving] = useState(false);
    const [localMuted, setLocalMuted] = useState(false);
    
    // Form States
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

    // 1. Initial Data Sync
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

    // 2. Action Handlers
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updateData = { ...profile };
            delete updateData.email; // Email is persistent/read-only usually
            
            const res = await api.patch('/users/profile/update', updateData);
            updateUserInfo(res.data);
            toast.success("Identity Matrix Updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Verification Failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!passwords.newPassword) return toast.error("Key input required");
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error("Input mismatch: Keys do not align");
        }
        if (passwords.newPassword.length < 6) {
            return toast.error("Key strength insufficient (min 6 chars)");
        }

        setIsSaving(true);
        try {
            await api.patch('/users/profile/update', { password: passwords.newPassword });
            setPasswords({ newPassword: '', confirmPassword: '' });
            toast.success("Security Credentials Overwritten");
        } catch (err) {
            toast.error(err.response?.data?.message || "Override Interrupted");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const id = toast.loading("Uploading visual data...");
        try {
            const res = await api.post('/users/upload-avatar', formData);
            updateUserInfo({ avatarUrl: res.data.url });
            toast.success("Visual Identifier Synchronized", { id });
        } catch (err) {
            toast.error("Transmission failed", { id });
        }
    };

    const handleToggleAudio = () => {
        const newState = toggleMute();
        setLocalMuted(newState);
        toast(newState ? "Audio Feed Muted" : "Audio Feed Active", { 
            icon: newState ? <BellOff size={16} className="text-rose-500" /> : <Bell size={16} className="text-blue-500" /> 
        });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-[var(--border)]">
                <div>
                    <div className="flex items-center gap-3 mb-2 text-blue-500">
                        <Settings className="w-5 h-5 animate-spin-slow" />
                        <span className="text-xs font-black tracking-[0.3em] uppercase italic">System Calibration</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tighter uppercase italic">
                        Account <span className="text-blue-500">Config</span>
                    </h1>
                    <p className="text-[var(--muted)] mt-2 max-w-lg text-sm font-medium">
                        Configure your entity parameters and security protocols.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Module 1: Visual Identity */}
                <div className="lg:col-span-1">
                    <ProfileIdentity 
                        user={user} 
                        onAvatarUpload={handleAvatarUpload} 
                        profileName={profile.name} 
                    />
                </div>

                {/* Module 2: Profile Data & Module 3: Security/Audio */}
                <div className="lg:col-span-2 space-y-10">
                    <ProfileDataForm 
                        profile={profile}
                        setProfile={setProfile}
                        onSubmit={handleProfileUpdate}
                        isSaving={isSaving}
                    />

                    <SecurityAndAudioSettings 
                        passwords={passwords}
                        setPasswords={setPasswords}
                        onPasswordSubmit={handlePasswordUpdate}
                        isSaving={isSaving}
                        isMuted={localMuted}
                        onToggleMute={handleToggleAudio}
                    />
                </div>
            </div>
        </div>
    );
}
