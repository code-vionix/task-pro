
import { useEffect, useRef } from 'react';
import api from '../lib/api';

/**
 * Hook to monitor user focus and tab activity during an active task.
 * Logs activity (blur, tab switch) to the backend for audit trail.
 */
export const useTaskMonitor = (taskId, isActive) => {
  const lastActivityRef = useRef(0);
  const COOLDOWN = 2000; // 2s cooldown to prevent log spamming
  const awayTimeRef = useRef(null);

  useEffect(() => {
    if (!taskId || !isActive) return;

    const logActivity = async (type, url = null, duration = null) => {
      const now = Date.now();
      if (now - lastActivityRef.current < COOLDOWN) return;
      
      lastActivityRef.current = now;
      try {
        await api.patch(`/tasks/${taskId}/activity`, { type, url, duration });
        console.warn(`[MONITOR] Activity logged: ${type}`, url ? `URL: ${url}` : '');
      } catch (err) {
        console.error('[MONITOR] Failed to log activity', err);
      }
    };

    const handleBlur = () => {
      awayTimeRef.current = Date.now();
      logActivity('WINDOW_BLUR', window.location.href);
    };
    
    const handleFocus = () => {
      if (awayTimeRef.current) {
        const duration = Math.floor((Date.now() - awayTimeRef.current) / 1000);
        logActivity('WINDOW_FOCUS', window.location.href, duration);
        awayTimeRef.current = null;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        awayTimeRef.current = Date.now();
        logActivity('TAB_SWITCH', window.location.href);
      } else if (document.visibilityState === 'visible' && awayTimeRef.current) {
        const duration = Math.floor((Date.now() - awayTimeRef.current) / 1000);
        logActivity('TAB_RETURN', window.location.href, duration);
        awayTimeRef.current = null;
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [taskId, isActive]);
};
