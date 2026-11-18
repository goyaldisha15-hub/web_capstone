import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export default function Notifications() {
  const { items, unread, markAllRead } = useNotifications();
  return (
    <div className="narrow">
      <h2>Notifications {unread > 0 && <span className="badge">{unread}</span>}</h2>
      {unread > 0 && <button onClick={markAllRead}>Mark all as read</button>}
      {items.length === 0 && <p>Nothing yet.</p>}
      {items.map((n) => (
        <div key={n._id} className={`card ${n.read ? '' : 'unread'}`}>
          <b>{n.sender?.name}</b> {n.type === 'like' ? 'liked' : 'commented on'}{' '}
          <Link to={`/posts/${n.post?._id}`}>{n.post?.title}</Link>
          <br /><small>{new Date(n.createdAt).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}