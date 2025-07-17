import React, { useState } from 'react';

const API_URL = '/api/admin/register';

const AdminRegister: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSuccess(false);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage('Admin registered successfully!');
        setUsername(''); setEmail(''); setPassword(''); setRole('viewer');
      } else {
        setMessage(data.msg || 'Registration failed');
      }
    } catch (err) {
      setMessage('Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Admin Registration</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Email<br/>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Username<br/>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Password<br/>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Role<br/>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%' }}>
              <option value="super admin">Super Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
        </div>
        <button type="submit" style={{ width: '100%', padding: 10 }}>Register</button>
      </form>
      {message && <div style={{ marginTop: 20, color: success ? 'green' : 'red' }}>{message}</div>}
    </div>
  );
};

export default AdminRegister; 