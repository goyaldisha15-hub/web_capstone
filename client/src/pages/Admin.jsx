import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/admin/users'), api('/admin/stats')])
      .then(([u, s]) => { setUsers(u.users); setStats(s); })
      .catch((e) => setError(e.message));
  }, []);

  const changeRole = async (id, role) => {
    try {
      const d = await api(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } });
      setUsers(users.map((u) => (u._id === id ? { ...u, role: d.user.role } : u)));
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <h2>Admin panel</h2>
      {error && <p className="error">{error}</p>}
      {stats && (
        <div className="stats">
          {stats.usersByRole.map((r) => <div key={r._id} className="card"><b>{r.count}</b><br />{r._id}s</div>)}
        </div>
      )}
      {stats?.topAuthors.length > 0 && (
        <>
          <h3>Top authors</h3>
          <ul>{stats.topAuthors.map((a) => <li key={a.name}>{a.name} – {a.posts} posts, {a.likes} likes</li>)}</ul>
        </>
      )}
      <h3>Users</h3>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td><td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}>
                  <option>reader</option><option>author</option><option>admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}