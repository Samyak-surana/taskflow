import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      {/* Grid background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>◈ TaskFlow</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.4rem' }}>Sign in to your workspace</p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow)' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-muted" style={{ marginTop: '1.25rem' }}>
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
          <div style={{ color: 'var(--text-sub)', marginBottom: '0.4rem', fontWeight: 600 }}>Demo credentials</div>
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>admin@taskflow.io / Admin123</div>
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>user@taskflow.io / User1234</div>
        </div>
      </div>
    </div>
  );
}
