import { Bell, CheckCircle, Heart, MessageCircle, MessageSquare, Search, Share2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const NOTIFICATION_ICONS = {
  REACTION: Heart,
  COMMENT: MessageSquare,
  SHARE: Share2,
  TASK_ASSIGNED: Bell,
  MESSAGE: MessageCircle,
  TASK_UNDER_REVIEW: Search,
  TASK_APPROVED: CheckCircle,
  TASK_REJECTED: XCircle,
  default: Bell
};

export default function NotificationPopup({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const Icon = NOTIFICATION_ICONS[notification?.type] || NOTIFICATION_ICONS.default;

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(progressInterval);
          return 0;
        }
        return prev - 2; // Decrease by 2% every 100ms (5 seconds total)
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [notification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  if (!notification) return null;

  return (
    <div 
      className={`fixed top-24 right-6 z-[100] transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="glass-card p-4 w-80 shadow-2xl border border-[var(--border)] relative overflow-hidden group">
        {/* Progress bar */}
        <div 
          className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-blue-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--foreground)] leading-relaxed">
              {notification.message}
            </p>
            <span className="text-xs text-[var(--muted)] font-medium mt-1 block">
              Just now
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
