
import { AlertCircle, CheckCircle2, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const CATEGORIES = [
  { id: 'WEB_DEV', label: 'Web Development', icon: Zap },
  { id: 'SOCIAL_MEDIA', label: 'Social Media', icon: Zap },
  { id: 'VIDEO_ENGAGEMENT', label: 'Video Engagement', icon: Zap },
  { id: 'MARKETING', label: 'Marketing', icon: Zap },
  { id: 'GENERAL', label: 'General Operations', icon: Zap },
];

export default function CategoryManager({ user, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(user?.category || '');

  const handleUpdate = async () => {
    if (!selected) return toast.error("Please select a category");
    setLoading(true);
    try {
      const res = await api.patch('/users/profile/category', { category: selected });
      onUpdate(res.data);
      toast.success("Operation Category Locked");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Mission Specialization</h3>
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
            You can only change your specialization <strong>once every 30 days</strong>. You will only see and be able to claim tasks matching your chosen category.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left ${
                selected === cat.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected === cat.id ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <cat.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-tight">{cat.label}</span>
              {selected === cat.id && <CheckCircle2 className="w-5 h-5 ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleUpdate}
        disabled={loading || selected === user?.category}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
          selected === user?.category
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
        }`}
      >
        {loading ? 'Locking Signal...' : selected === user?.category ? 'Specialization Active' : 'Lock Specialization'}
      </button>
    </div>
  );
}
