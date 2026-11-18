import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

export default function PostEditor() {
  const { id } = useParams();            // present when editing
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', tags: '', status: 'draft' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api(`/posts/${id}`).then(({ post }) =>
      setForm({ title: post.title, content: post.content, tags: post.tags.join(', '), status: post.status })
    ).catch((e) => setError(e.message));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    const body = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    };
    try {
      const d = id
        ? await api(`/posts/${id}`, { method: 'PUT', body })
        : await api('/posts', { method: 'POST', body });
      navigate(`/posts/${d.post._id}`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="card form narrow">
      <h2>{id ? 'Edit post' : 'Write a new post'}</h2>
      {error && <p className="error">{error}</p>}
      <label>Title<input name="title" value={form.title} onChange={handleChange} maxLength={150} required /></label>
      <label>Content<textarea name="content" rows={10} value={form.content} onChange={handleChange} required /></label>
      <label>Tags (comma separated)<input name="tags" value={form.tags} onChange={handleChange} placeholder="react, mern, tips" /></label>
      <label>Status
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <button disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
    </form>
  );
}