
import { Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

/**
 * VerifyOtp Page
 * Handles the terminal sequence for verifying magic links and password reset tokens.
 */
export default function VerifyOtp() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [error, setError] = useState('');
    const hasVerified = useRef(false);

    useEffect(() => {
        if (hasVerified.current) return;

        const email = searchParams.get('email');
        const token = searchParams.get('token');

        if (!email || !token) {
            setStatus('error');
            setError('Missing decryption parameters.');
            return;
        }

        const verify = async () => {
            try {
                hasVerified.current = true;
                const res = await api.post('/auth/verify-magic-link', { email, token });
                const { access_token, refresh_token, user } = res.data;
                
                // Small delay for visual impact of the terminal sequence
                setTimeout(() => {
                    login(access_token, refresh_token, user);
                    setStatus('success');
                    setTimeout(() => navigate('/'), 1200);
                }, 1000);
            } catch (err) {
                setStatus('error');
                setError(err.response?.data?.message || 'Key verification failure.');
            }
        };

        verify();
    }, [searchParams, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden">
            {/* Background ambiance */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md px-8 z-10 animate-in fade-in zoom-in duration-700">
                <div className="glass-card p-12 rounded-[2.5rem] shadow-2xl border border-[var(--border)] text-center space-y-10 bg-[var(--card)]/40 backdrop-blur-2xl">
                    {status === 'verifying' && (
                        <>
                            <div className="w-24 h-24 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto border border-blue-500/20 shadow-inner">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tighter italic">Verifying Link</h2>
                                <p className="text-[var(--muted)] text-[10px] uppercase font-black tracking-[0.3em] mt-3 opacity-60">Connecting to secure terminal...</p>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                <ShieldCheck className="w-12 h-12 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tighter italic">Access Granted</h2>
                                <p className="text-[var(--muted)] text-[10px] uppercase font-black tracking-[0.3em] mt-3 opacity-60">Identity verified. Entering grid...</p>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-24 h-24 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/10">
                                <XCircle className="w-12 h-12 text-rose-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tighter italic">Access Denied</h2>
                                <p className="text-rose-500 text-[10px] uppercase font-black tracking-[0.2em] mt-3 opacity-80">{error}</p>
                            </div>
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-2xl border border-[var(--border)] transition-all shadow-sm active:scale-95"
                            >
                                Back to Base
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
