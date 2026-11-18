import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, API_URL, getTokens } from '../api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    const d = await api('/notifications');
    setItems(d.notifications);
    setUnread(d.unread);
  }, []);

  // load history + open socket while logged in
  useEffect(() => {
    if (!user) { setItems([]); setUnread(0); return; }
    load().catch(() => {});

    const socket = io(API_URL, {
      auth: (cb) => cb({ token: getTokens()?.accessToken }) // always sends the latest token
    });
    socket.on('notification', (n) => {
      setItems((prev) => [n, ...prev]);
      setUnread((c) => c + 1);
      setToast(n);
      setTimeout(() => setToast(null), 4000);
    });
    return () => socket.disconnect();
  }, [user, load]);

  const markAllRead = async () => {
    await api('/notifications/read-all', { method: 'PATCH' });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <NotificationContext.Provider value={{ items, unread, markAllRead }}>
      {children}
      {toast && (
        <div className="toast">
          <b>{toast.sender?.name}</b> {toast.type === 'like' ? 'liked' : 'commented on'} “{toast.post?.title}”
        </div>
      )}
    </NotificationContext.Provider>
  );
}