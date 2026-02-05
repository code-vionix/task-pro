
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const res = await api.get('/users/profile');
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
            } catch (err) {
                console.error("Failed to sync profile", err);
            }
        }
        setIsLoading(false);
    };
    fetchProfile();
  }, []);

  const login = (token, refreshToken, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUserInfo = (userData) => {
    setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...userData };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const [guestDataSeed, setGuestDataSeed] = useState(() => Math.floor(Math.random() * 100));

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserInfo, isLoading, guestDataSeed }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
