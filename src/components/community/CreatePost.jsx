
import { Image as ImageIcon, Loader2, Send, ShieldAlert, X } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { compressImage } from '../../lib/imageOptimizer';

/**
 * CreatePost component handles the interface and logic for creating a new post.
 * Includes image compression and optimistic state updates.
 */
export default function CreatePost({ user, onPostSuccess }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const isGuest = user?.role === 'GUEST';
  const isRestricted = user?.role !== 'ADMIN' && !user?.canUseCommunity;
  const canPost = user?.role === 'ADMIN' || user?.canPost;

  // Handle image selection and compression
  const handleFileChange = async (e) => {
    if (isGuest) return toast.error("Observation Mode: Upload restricted.");
    if (!canPost) return toast.error("Your posting privileges have been suspended.");
    
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      try {
        const compressed = await compressImage(file);
        setImageFile(compressed);
      } catch (err) {
        console.error('Compression failed', err);
        setImageFile(file);
      }
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit the post to the server
  const handleCreatePost = async () => {
    if (isGuest) return toast.error("Observation Mode: Posting restricted.");
    if (!canPost) return toast.error("Your posting privileges have been suspended.");
    if (!content.trim() && !imageFile) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (imageFile) {
        formData.append('file', imageFile);
      }

      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setContent('');
      clearImage();
      toast.success('Transmission successful');
      if (onPostSuccess) onPostSuccess(res.data);
    } catch (err) {
      toast.error('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 space-y-4 relative group mb-8">
      {/* Overlay for restricted users */}
      {(isGuest || isRestricted || !canPost) && (
        <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
          <div className="bg-amber-500/20 border border-amber-500/30 px-6 py-3 rounded-2xl flex items-center gap-3 animate-in zoom-in">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-500">
              {isRestricted ? "Access Restricted" : isGuest ? "Guest Mode" : "Posting Blocked"}
            </span>
          </div>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Spread your transmission..."
        disabled={isGuest}
        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] resize-none disabled:opacity-50"
      />
      
      {imagePreview && (
        <div className="relative">
          <img src={imagePreview} alt="Preview" className="max-h-60 rounded-lg border border-[var(--border)] object-cover" />
          <button onClick={clearImage} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center border-t border-[var(--border)] pt-4">
        <button 
          onClick={() => !isGuest && fileInputRef.current?.click()} 
          disabled={isGuest}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-bold disabled:opacity-30"
        >
          <ImageIcon className="w-5 h-5" />
          <span>Media Payload</span>
        </button>
        
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="hidden" 
        />

        <button 
          onClick={handleCreatePost} 
          disabled={loading || isGuest || (!content.trim() && !imageFile)}
          className="premium-gradient text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Transmitting...' : 'Transmit'}
        </button>
      </div>
    </div>
  );
}
