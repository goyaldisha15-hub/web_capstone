import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CommentItem from '../components/CommentItem';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const loadComments = useCallback(
    () => api(`/posts/${id}/comments`).then((d) => setComments(d.comments)), [id]);

  useEffect(() => {
    api(`/posts/${id}`).then((d) => setPost(d.post)).catch((e) => setError(e.message));
    loadComments().catch(() => {});
  }, [id, loadComments]);

  if (error) return <p className="center error">{error}</p>;
  if (!post) return <p className="center">Loading…</p>;

  const liked = user && post.likes?.includes(user.id);
  const canEdit = user && (user.id === post.author._id || user.role === 'admin');

  const toggleLike = async () => {
    try {
      const d = await api(`/posts/${id}/like`, { method: 'POST' });
      setPost({
        ...post,
        likes: d.liked ? [...post.likes, user.id] : post.likes.filter((l) => l !== user.id)
      });
    } catch (e) { setError(e.message); }
  };

  const addComment = async (e) => {
    e.preventDefault();
    try {
      await api(`/posts/${id}/comments`, { method: 'POST', body: { text } });
      setText(''); loadComments();
    } catch (err) { setError(err.message); }
  };

  const remove = async () => {
    if (!confirm('Delete this post?')) return;
    await api(`/posts/${id}`, { method: 'DELETE' });
    navigate('/dashboard');
  };

  return (
    <div className="narrow">
      <article className="card">
        <h1>{post.title}</h1>
        <p className="meta">
          by <Link to={`/users/${post.author._id}`}>{post.author.name}</Link> · {new Date(post.createdAt).toLocaleDateString()}
          {post.status === 'draft' && <span className="tag draft">draft</span>}
        </p>
        <p className="content">{post.content}</p>
        <div>{post.tags?.map((t) => <span key={t} className="tag">#{t}</span>)}</div>
        <p>
          {user
            ? <button onClick={toggleLike}>{liked ? '❤ Liked' : '🤍 Like'} ({post.likes?.length || 0})</button>
            : <span>❤ {post.likes?.length || 0} · <Link to="/login">login</Link> to like</span>}
          {canEdit && <> <Link to={`/posts/${id}/edit`}>Edit</Link> <button className="link danger" onClick={remove}>Delete</button></>}
        </p>
      </article>

      <h3>Comments</h3>
      {user ? (
        <form onSubmit={addComment} className="inline">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" required />
          <button>Post</button>
        </form>
      ) : <p><Link to="/login">Login</Link> to comment.</p>}
      {comments.length === 0 && <p>No comments yet.</p>}
      {comments.map((c) => <CommentItem key={c._id} comment={c} postId={id} onChange={loadComments} />)}
    </div>
  );
}