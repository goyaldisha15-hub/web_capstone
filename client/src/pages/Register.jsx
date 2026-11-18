import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'reader' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setBusy(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="card form">
      <h2>Create account</h2>
      {error && <p className="error">{error}</p>}
      <label>Name<input name="name" value={form.name} onChange={handleChange} required /></label>
      <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} required /></label>
      <label>Password<input type="password" name="password" value={form.password} onChange={handleChange} required /></label>
      <label>I want to
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="reader">Read blogs (Reader)</option>
          <option value="author">Write blogs (Author)</option>
        </select>
      </label>
      <button disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
      <p>Already registered? <Link to="/login">Login</Link></p>
    </form>
  );
}