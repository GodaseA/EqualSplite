import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';

const AuthContext = createContext(null);
const USER_KEY = 'expense_splitter_user';
const TOKEN_KEY = 'expense_splitter_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const saveSession = useCallback((nextUser, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem(TOKEN_KEY)) { setLoading(false); return () => { active = false; }; }
    api.get('/auth/me')
      .then(({ data }) => { if (active && data.user) { setUser(data.user); localStorage.setItem(USER_KEY, JSON.stringify(data.user)); } })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    saveSession(data.user, data.token);
    return data.user;
  }, [saveSession]);

  const register = useCallback(async (details) => {
    const { data } = await api.post('/auth/register', details);
    saveSession(data.user, data.token);
    return data.user;
  }, [saveSession]);

  const updateUser = useCallback(async (updates) => {
    const { data } = await api.patch('/auth/me', updates);
    setUser(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, updateUser }), [user, loading, login, register, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
