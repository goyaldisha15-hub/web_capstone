import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import PostCard from '../components/PostCard';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [search, setSearch] = useState('');   // controlled input
  const [query, setQuery] = useState('');     // submitted search
  const [tag, setTag] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tag) params.set('tag', tag);
    api(`/posts?${params}`).then((d) => setPosts(d.posts)).catch((e) => setError(e.message));
  }, [query, tag]);

  useEffect(() => {
    api('/posts/trending').then((d) => setTrending(d.posts)).catch(() => {});
  }, []);

  const submit = (e) => { e.preventDefault(); setQuery(search.trim()); };

  return (
    <div className="layout">
      <section>
        <form onSubmit={submit} className="inline">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or content…" />
          <button>Search</button>
          {(query || tag) && <button type="button" onClick={() => { setSearch(''); setQuery(''); setTag(''); }}>Clear</button>}
        </form>
        {tag && <p>Filtering by <span className="tag">#{tag}</span></p>}
        {error && <p className="error">{error}</p>}
        {posts.length === 0 && !error && <p>No posts found.</p>}
        {posts.map((p) => (
          <div key={p._id}>
            <PostCard post={p} />
            {p.tags?.length > 0 && (
              <small>{p.tags.map((t) => <button key={t} className="link" onClick={() => setTag(t)}>filter #{t}</button>)}</small>
            )}
          </div>
        ))}
      </section>

      <aside className="card">
        <h3>🔥 Trending</h3>
        {trending.length === 0 && <p>Nothing yet.</p>}
        <ol>
          {trending.map((p) => (
            <li key={p._id}>
              <Link to={`/posts/${p._id}`}>{p.title}</Link>
              <br /><small>❤ {p.likesCount} · 💬 {p.commentsCount}</small>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}