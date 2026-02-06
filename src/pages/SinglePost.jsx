
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function SinglePost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/public/posts/${id}`);
      setPost(res.data);
      // Update page title
      if (res.data.content) {
          document.title = `${res.data.content.substring(0, 30)}... | Post`;
      }
    } catch (err) {
      console.error(err);
      toast.error('Post not found or unavailable');
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--foreground)]">Loading post...</div>;
  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen pt-20">
       <button onClick={() => navigate('/community')} className="mb-4 text-slate-400 hover:text-[var(--foreground)] transition-colors text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          &larr; Back to Community
       </button>
       <PostCard 
          post={post} 
          currentUser={user || { role: 'GUEST', id: 'guest' }} 
          onUpdate={fetchPost} 
       />
    </div>
  );
}
