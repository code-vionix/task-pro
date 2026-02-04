
import { Image as ImageIcon, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 15000); 
    return () => clearInterval(interval);
  }, []);

  // Handle auto-scrolling to post from hash
  useEffect(() => {
     if (posts.length > 0 && window.location.hash) {
         const id = window.location.hash.replace('#post-', '');
         const element = document.getElementById(`post-${id}`);
         if (element) {
             setTimeout(() => {
                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 element.classList.add('ring-2', 'ring-blue-500/50', 'ring-offset-4', 'ring-offset-[#030712]');
                 setTimeout(() => element.classList.remove('ring-2', 'ring-blue-500/50'), 3000);
             }, 100);
         }
     }
  }, [posts, window.location.hash]);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  const clearImage = () => {
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createPost = async () => {
    if (!content.trim() && !imageFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (imageFile) {
          formData.append('file', imageFile);
      }

      await api.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      setContent('');
      clearImage();
      fetchPosts();
    } catch (err) {
      alert('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700">
      <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Community Feed</h1>
      
      {/* Create Post Interface */}
      <div className="glass-card p-4 space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] resize-none"
        />
        
        {imagePreview && (
            <div className="relative">
                <img src={imagePreview} alt="Preview" className="max-h-60 rounded-lg border border-[var(--border)]" />
                <button onClick={clearImage} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white no-underline">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}

        <div className="flex justify-between items-center border-t border-[var(--border)] pt-4">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-bold">
                <ImageIcon className="w-5 h-5" />
                <span>Photo/Video</span>
            </button>
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden" 
            />

            <button 
                onClick={createPost} 
                disabled={loading || (!content.trim() && !imageFile)}
                className="premium-gradient text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
                <Send className="w-4 h-4" />
                {loading ? 'Posting...' : 'Post'}
            </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} id={`post-${post.id}`}>
            <PostCard post={post} onUpdate={fetchPosts} currentUser={user} />
          </div>
        ))}
      </div>
    </div>
  );
}
