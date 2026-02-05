import { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import NotificationPopup from '../components/NotificationPopup';
import { soundManager } from '../lib/sounds';
import { useAuth } from './AuthContext';

const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [currentNotification, setCurrentNotification] = useState(null);
  const notificationQueueRef = useRef([]);

  useEffect(() => {
    // Initialize mute state from localStorage
    const savedMute = localStorage.getItem('mute_notifications');
    soundManager.setMuted(savedMute === 'true');
  }, []);

  const showNotificationPopup = (notification) => {
    // Add to queue
    notificationQueueRef.current.push(notification);
    
    // If no notification is currently showing, show the next one
    if (!currentNotification) {
      displayNextNotification();
    }
  };

  const displayNextNotification = () => {
    if (notificationQueueRef.current.length > 0) {
      const nextNotification = notificationQueueRef.current.shift();
      setCurrentNotification(nextNotification);
    } else {
      setCurrentNotification(null);
    }
  };

  const handleCloseNotification = () => {
    // Show next notification in queue after a brief delay
    setTimeout(() => {
      displayNextNotification();
    }, 300);
  };

  useEffect(() => {
    if (user && !socketRef.current) {
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 
        console.log('[Socket] Connecting to:', socketUrl);
        console.log('[Socket] User ID:', user.id);
        
        socketRef.current = io(socketUrl, {
            auth: {
                token: localStorage.getItem('access_token')
            }
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
             console.log('[Socket] Connected! Socket ID:', socket.id);
             if (user.id) {
                 console.log('[Socket] Joining user room:', user.id);
                 socket.emit('join_user', user.id);
             }
        });

        socket.on('connect_error', (error) => {
             console.error('[Socket] Connection error:', error);
        });

        socket.on('disconnect', (reason) => {
             console.log('[Socket] Disconnected:', reason);
        });

        // Global Message Listener
        socket.on('newMessage', (message) => {
            console.log('[Socket] New message received:', message);
            const isInChat = window.location.pathname.includes('/chat');
            
            // Only play sound, no toast as requested (notifications should only be on the icon)
            soundManager.playMessage();
            
            // Trigger custom event for Layout to update message count
            window.dispatchEvent(new CustomEvent('newMessage', { detail: message }));
        });

        // Global Notification Listener - Enhanced with popup
        socket.on('newNotification', (notification) => {
             console.log('[Socket] ✅ New notification received:', notification);
             
             // Play sound
             soundManager.playNotification();
             
             // Show popup notification
             showNotificationPopup(notification);
             
             // Also show toast for redundancy
             toast(notification.message, {
                 icon: '🔔',
                 duration: 3000
             });
             
             // Trigger custom event for Layout to update notification list
             window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
        });

        // Global Message Read Listener
        socket.on('messagesRead', (data) => {
            console.log('[Socket] Messages marked as read:', data);
            window.dispatchEvent(new CustomEvent('messagesRead', { detail: data }));
        });

        return () => {
            if (socketRef.current) {
                console.log('[Socket] Cleaning up connection');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }
  }, [user]);

  const toggleMute = () => {
      const currentState = localStorage.getItem('mute_notifications') === 'true';
      const newState = !currentState;
      localStorage.setItem('mute_notifications', String(newState));
      soundManager.setMuted(newState);
      return newState;
  };

  const isMuted = () => {
      return localStorage.getItem('mute_notifications') === 'true';
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, toggleMute, isMuted }}>
      {children}
      {currentNotification && (
        <NotificationPopup 
          notification={currentNotification} 
          onClose={handleCloseNotification}
        />
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context || {};
};
