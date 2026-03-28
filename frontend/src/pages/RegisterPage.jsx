import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const fieldError = (field) => fieldErrors.find((e) => e.field === field)?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setFieldErrors([]);
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setFieldErrors(data.errors);
      else setError(data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>◈ TaskFlow</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.4rem' }}>Create your account</p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow)' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
              {fieldError('name') && <div style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{fieldError('name')}</div>}
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {fieldError('email') && <div style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{fieldError('email')}</div>}
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input type="password" placeholder="Min 8 chars, upper + lower + number" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              {fieldError('password') && <div style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{fieldError('password')}</div>}
            </div>
            <div className="form-group">
              <label className="label">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : 'Create account →'}
            </button>
          </form>

          <p className="text-center text-muted" style={{ marginTop: '1.25rem' }}>
            Have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
