import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => api(`/users/${id}`).then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id, user]);

  const toggleFollow = async () => {
    try { await api(`/users/${id}/follow`, { method: 'POST' }); load(); }
    catch (e) { setError(e.message); }
  };

  if (error) return <p className="center error">{error}</p>;
  if (!data) return <p className="center">Loading…</p>;

  const isMe = user?.id === id;
  return (
    <div className="narrow">
      <div className="card">
        <h2>{data.user.name} <small>({data.user.role})</small></h2>
        <p>{data.user.bio || 'No bio yet.'}</p>
        <p><b>{data.followers}</b> followers · <b>{data.following}</b> following</p>
        {user && !isMe && <button onClick={toggleFollow}>{data.isFollowing ? 'Unfollow' : 'Follow'}</button>}
      </div>
      <h3>Posts</h3>
      {data.posts.length === 0 && <p>No published posts.</p>}
      {data.posts.map((p) => <PostCard key={p._id} post={{ ...p, author: { _id: id, name: data.user.name } }} />)}
    </div>
  );
}