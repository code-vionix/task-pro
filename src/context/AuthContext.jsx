
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only set loading to false, restore is handled below
    setIsLoading(false);
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

  // Restore user from local storage on load
  useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
          setUser(JSON.parse(storedUser));
      }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserInfo, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
