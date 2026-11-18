import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// <ProtectedRoute>            -> any logged-in user
// <ProtectedRoute roles={[]}> -> role-based page (RBAC on the frontend)
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    return <p className="center error">403 – your role ({user.role}) can’t open this page.</p>;
  }
  return children;
}