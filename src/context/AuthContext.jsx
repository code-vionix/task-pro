
import { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../lib/api';
import { loginSuccess, logout as logoutAction, setLoading, updateUser } from '../store/slices/authSlice';

const AuthContext = createContext(undefined);

/**
 * AuthProvider now acts as a bridge between the existing useAuth hook 
 * and the new Redux state management. This ensures backwards compatibility
 * while moving towards a unified state store.
 */
export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector(state => state.auth);
  const [guestDataSeed] = useState(() => Math.floor(Math.random() * 100));

  useEffect(() => {
    const fetchProfile = async () => {
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        if (token) {
            try {
                const res = await api.get('/users/profile');
                dispatch(loginSuccess({ access_token: token, refresh_token: refreshToken, user: res.data }));
            } catch (err) {
                console.error("Failed to sync profile", err);
            }
        }
        dispatch(setLoading(false));
    };
    fetchProfile();
  }, [dispatch]);

  const login = (token, refreshToken, userData) => {
    dispatch(loginSuccess({ access_token: token, refresh_token: refreshToken, user: userData }));
  };

  const updateUserInfo = (userData) => {
    dispatch(updateUser(userData));
  };

  const logout = () => {
    dispatch(logoutAction());
  };

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
