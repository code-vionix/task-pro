
import clsx from 'clsx';
import { Check, Copy, Facebook, Linkedin, MessageCircle, Send, Share2, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PostShareModal({ post, onClose }) {
  const [copied, setCopied] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Use the public share endpoint
  const shareUrl = `${apiUrl}/public/posts/${post.id}/share-view`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-600'
    },
    {
       name: 'Messenger',
       icon: <MessageCircle className="w-5 h-5" />,
       url: `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`, 
       color: 'bg-blue-500',
       onClick: (e) => {
           // Fallback for desktop users where fb-messenger protocol might not work
           if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
               e.preventDefault();
               toast("Messenger sharing is best on mobile. Link copied!");
               handleCopy();
           }
       }
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />, // Use compatible icon
      url: `https://wa.me/?text=${encodeURIComponent(post.content?.substring(0,50) + '... ' + shareUrl)}`,
      color: 'bg-green-500'
    },
    {
      name: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.content?.substring(0,50))}`,
      color: 'bg-sky-500'
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-700'
    },
    {
        name: 'More',
      icon: <Share2 className="w-5 h-5" />, // Or just Share icon
        url: null, 
        color: 'bg-orange-500',
        onClick: async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Check out this post',
                        text: post.content?.substring(0, 100),
                        url: shareUrl
                    });
                } catch (err) {
                    console.error('Error sharing:', err);
                }
            } else {
                toast.error('Native sharing not supported');
                handleCopy();
            }
        }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card)]">
          <h3 className="font-black uppercase tracking-widest text-[var(--foreground)] text-xs italic">Share Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--border)] rounded-full text-[var(--muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-3 gap-y-6 gap-x-4 bg-[var(--card)]/50">
           {shareLinks.map((link) => (
             <a 
                key={link.name} 
                href={link.url || '#'} 
                target={link.url ? "_blank" : "_self"}
                rel="noopener noreferrer"
                onClick={link.onClick ? (e) => { e.preventDefault(); link.onClick(e); } : undefined}
                className="flex flex-col items-center gap-2 group/share cursor-pointer"
             >
                <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover/share:scale-110", link.color)}>
                    {link.icon}
                </div>
                <span className="text-[10px] font-bold uppercase text-[var(--muted)] group-hover/share:text-[var(--foreground)]">{link.name}</span>
             </a>
           ))}
        </div>

        <div className="p-4 bg-[var(--card)] border-t border-[var(--border)]">
             <div className="flex items-center gap-2 p-2 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                <input 
                    type="text" 
                    readOnly 
                    value={shareUrl} 
                    className="flex-1 bg-transparent text-xs text-[var(--foreground)] outline-none" 
                />
                <button 
                    onClick={handleCopy}
                    className="p-2 hover:bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg transition-colors"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
             </div>
        </div>
      </div>
    </div>
  );
}
