import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <nav className="nav">
      <Link to="/" className="brand">BlogSphere</Link>
      <div className="links">
        <NavLink to="/">Home</NavLink>
        {user && <NavLink to="/feed">My Feed</NavLink>}
        {user && ['author', 'admin'].includes(user.role) && <NavLink to="/dashboard">Dashboard</NavLink>}
        {user && ['author', 'admin'].includes(user.role) && <NavLink to="/posts/new">Write</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        {user && <NavLink to="/notifications">🔔{unread > 0 && <span className="badge">{unread}</span>}</NavLink>}
      </div>
      <div className="links">
        {user ? (
          <>
            <Link to={`/users/${user.id}`}>{user.name} <small>({user.role})</small></Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}