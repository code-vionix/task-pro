
import { Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

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
            setError('Missing authentication parameters.');
            return;
        }

        const verify = async () => {
            try {
                hasVerified.current = true;
                const res = await api.post('/auth/verify-magic-link', { email, token });
                const { access_token, refresh_token, user } = res.data;
                
                // Keep tokens for profile update session
                localStorage.setItem('tokens', JSON.stringify({ access_token, refresh_token }));
                
                // Small delay for visual feedback
                setTimeout(() => {
                    login(access_token, refresh_token, user);
                    setStatus('success');
                    setTimeout(() => navigate('/'), 1500);
                }, 1000);
            } catch (err) {
                setStatus('error');
                setError(err.response?.data?.message || 'Magic link verification failed.');
            }
        };

        verify();
    }, [searchParams, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md px-6 z-10 animate-in fade-in zoom-in duration-500">
                <div className="glass p-10 rounded-[2.5rem] shadow-2xl border border-[var(--border)] text-center space-y-6">
                    {status === 'verifying' && (
                        <>
                            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--foreground)]">Verifying Link</h2>
                                <p className="text-[var(--muted)] text-sm mt-2">Connecting to secure terminal...</p>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--foreground)]">Access Granted</h2>
                                <p className="text-[var(--muted)] text-sm mt-2">Authentication successful. Redirecting...</p>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
                                <XCircle className="w-10 h-10 text-rose-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--foreground)]">Access Denied</h2>
                                <p className="text-rose-500/80 text-sm mt-2 font-medium">{error}</p>
                            </div>
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] font-bold py-3 rounded-xl border border-[var(--border)] transition-all"
                            >
                                Back to Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
