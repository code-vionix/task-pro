
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function PostContent({ post }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="p-4 space-y-4">
      {post.content && (
        <p className="text-[var(--foreground)] opacity-90 whitespace-pre-wrap leading-relaxed text-sm font-medium">
          {post.content}
        </p>
      )}
      
      {post.imageUrl && (
        <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] group/img">
          <div className={clsx(
            "absolute inset-0 skeleton flex items-center justify-center bg-[var(--card-hover)] z-0 transition-opacity duration-1000",
            imageLoaded ? "opacity-0 invisible" : "opacity-100 visible"
          )}>
            <Loader2 className="w-8 h-8 animate-spin text-blue-500/20" />
          </div>
          <img 
            src={post.imageUrl} 
            alt="Post content" 
            className={clsx(
              "w-full h-auto object-cover max-h-[600px] transition-all duration-1000 ease-out",
              imageLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.02] blur-xl"
            )} 
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        </div>
      )}

      {post.sharedPost && (
        <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--card)] group-hover/card:border-blue-500/30 transition-colors mt-4">
          <div className="p-3 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--foreground)]/[0.02]">
            <div className="w-7 h-7 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] text-[10px] font-bold border border-[var(--border)] overflow-hidden shrink-0">
              {post.sharedPost.user.avatarUrl ? (
                <img 
                  src={post.sharedPost.user.avatarUrl} 
                  className="w-full h-full object-cover" 
                  style={{ objectPosition: post.sharedPost.user.avatarPosition ? `${post.sharedPost.user.avatarPosition.x}% ${post.sharedPost.user.avatarPosition.y}%` : 'center' }} 
                  loading="lazy" 
                />
              ) : post.sharedPost.user.email[0].toUpperCase()}
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase text-[var(--foreground)]">{post.sharedPost.user.email.split('@')[0]}</h4>
              <p className="text-[8px] uppercase font-bold text-[var(--muted)]">{new Date(post.sharedPost.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {post.sharedPost.content && (
              <p className="text-xs text-[var(--foreground)] opacity-80 whitespace-pre-wrap leading-relaxed">
                {post.sharedPost.content}
              </p>
            )}
            {post.sharedPost.imageUrl && (
              <img src={post.sharedPost.imageUrl} alt="Shared content" className="w-full rounded-lg border border-[var(--border)] shadow-sm" loading="lazy" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
