
import { Eye, EyeOff, Loader2, Lock, Save, User } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function SetProfilePopup({ user, onComplete }) {
    const { updateUserInfo } = useAuth();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const trimmedName = name.trim();
        const trimmedPassword = password.trim();

        if (!trimmedName) return toast.error("Name is required");
        if (!trimmedPassword) return toast.error("Password is required");
        if (trimmedPassword.length < 6) return toast.error("Password must be at least 6 characters");

        setIsLoading(true);
        try {
            console.log('Finalizing profile for:', user?.email);
            const res = await api.patch('/users/profile/update', { 
                name: trimmedName, 
                password: trimmedPassword 
            });
            console.log('Profile update response:', res.data);
            
            // Critical: Update global auth state so isProfileSet becomes true
            updateUserInfo(res.data);
            
            toast.success("Profile Saved! Welcome.");
            
            // Short delay to ensure state propagates before closing
            setTimeout(() => {
                if (typeof onComplete === 'function') {
                    onComplete();
                }
            }, 500);
        } catch (err) {
            console.error('Profile update error:', err);
            toast.error(err.response?.data?.message || "Failed to finalize profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="glass w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 premium-gradient"></div>
                
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl premium-gradient flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Complete Your Profile</h2>
                    <p className="text-slate-400 text-sm mt-3 px-4">
                        Please fill in your details to get started.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Tuhin Rahman"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all font-medium"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all font-medium"
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full premium-gradient text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 disabled:opacity-50 mt-4 h-14 uppercase tracking-widest text-xs"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Save & Continue</span>
                                <Save className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
