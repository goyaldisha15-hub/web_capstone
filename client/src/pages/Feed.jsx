import { useEffect, useState } from 'react';
import { api } from '../api';
import PostCard from '../components/PostCard';

export default function Feed() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/posts/feed').then((d) => setPosts(d.posts)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="narrow">
      <h2>My feed</h2>
      {error && <p className="error">{error}</p>}
      {posts && posts.length === 0 && <p>Your feed is empty. Follow some authors to see their posts here.</p>}
      {posts?.map((p) => <PostCard key={p._id} post={p} />)}
    </div>
  );
}