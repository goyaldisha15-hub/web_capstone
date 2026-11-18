import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import PostCard from '../components/PostCard';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [tags, setTags] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/posts/mine'), api('/posts/stats/me')])
      .then(([p, s]) => { setPosts(p.posts); setStats(s.stats); setTags(s.topTags); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h2>Author dashboard</h2>
      {error && <p className="error">{error}</p>}
      {stats && (
        <div className="stats">
          <div className="card"><b>{stats.totalPosts}</b><br />Posts</div>
          <div className="card"><b>{stats.published}</b><br />Published</div>
          <div className="card"><b>{stats.drafts}</b><br />Drafts</div>
          <div className="card"><b>{stats.totalLikes}</b><br />Total likes</div>
        </div>
      )}
      {tags.length > 0 && <p>Top tags: {tags.map((t) => <span key={t._id} className="tag">#{t._id} ({t.count})</span>)}</p>}
      <p><Link to="/posts/new"><button>+ New post</button></Link></p>
      {posts.map((p) => (
        <div key={p._id}>
          <PostCard post={p} />
          <Link to={`/posts/${p._id}/edit`}>Edit</Link>
        </div>
      ))}
    </div>
  );
}