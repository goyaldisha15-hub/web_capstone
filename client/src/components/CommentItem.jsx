import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// Recursive component -> renders nested replies
export default function CommentItem({ comment, postId, onChange }) {
  const { user } = useAuth();
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const canDelete = user && (user.id === comment.author?._id || user.role === 'admin');

  const sendReply = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(`/posts/${postId}/comments`, { method: 'POST', body: { text, parent: comment._id } });
      setText(''); setReplying(false); onChange();
    } catch (err) { setError(err.message); }
  };

  const remove = async () => {
    if (!confirm('Delete this comment and its replies?')) return;
    await api(`/comments/${comment._id}`, { method: 'DELETE' });
    onChange();
  };

  return (
    <div className="comment">
      <p>
        <b><Link to={`/users/${comment.author?._id}`}>{comment.author?.name}</Link></b>{' '}
        <small>{new Date(comment.createdAt).toLocaleString()}</small>
      </p>
      <p>{comment.text}</p>
      {user && <button className="link" onClick={() => setReplying(!replying)}>Reply</button>}
      {canDelete && <button className="link danger" onClick={remove}>Delete</button>}

      {replying && (
        <form onSubmit={sendReply} className="inline">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" required />
          <button>Send</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}

      {comment.replies?.map((r) => (
        <CommentItem key={r._id} comment={r} postId={postId} onChange={onChange} />
      ))}
    </div>
  );
}