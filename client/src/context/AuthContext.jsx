import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, saveTokens, clearTokens, getTokens, setSessionExpiredHandler } from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutLocal = useCallback(() => { clearTokens(); setUser(null); }, []);

  useEffect(() => {
    setSessionExpiredHandler(logoutLocal);
    if (!getTokens()) { setLoading(false); return; }
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(logoutLocal)
      .finally(() => setLoading(false));
  }, [logoutLocal]);

  const authenticate = async (path, body) => {
    const data = await api(path, { method: 'POST', body });
    saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    return data.user;
  };

  const login = (email, password) => authenticate('/auth/login', { email, password });
  const register = (form) => authenticate('/auth/register', form);

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    logoutLocal();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}