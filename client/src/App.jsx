import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostDetail from './pages/PostDetail';
import PostEditor from './pages/PostEditor';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';

export default function App() {
  const writers = ['author', 'admin'];
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          {/* public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/users/:id" element={<Profile />} />

          {/* protected (any logged-in user) */}
          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          {/* role-based: author / admin */}
          <Route path="/dashboard" element={<ProtectedRoute roles={writers}><Dashboard /></ProtectedRoute>} />
          <Route path="/posts/new" element={<ProtectedRoute roles={writers}><PostEditor /></ProtectedRoute>} />
          <Route path="/posts/:id/edit" element={<ProtectedRoute roles={writers}><PostEditor /></ProtectedRoute>} />

          {/* role-based: admin only */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />

          <Route path="*" element={<p className="center">404 – page not found</p>} />
        </Routes>
      </main>
    </>
  );
}