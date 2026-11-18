import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="card form">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} required /></label>
      <label>Password<input type="password" name="password" value={form.password} onChange={handleChange} required /></label>
      <button disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </form>
  );
}