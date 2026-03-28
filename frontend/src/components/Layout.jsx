import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/tasks', label: 'Tasks', icon: '◎' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
            ◈ TaskFlow
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>API v1.0.0</div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)',
              fontWeight: 500, fontSize: '0.875rem', color: isActive ? 'var(--accent)' : 'var(--text-sub)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              textDecoration: 'none', transition: 'all var(--transition)',
            })}>
              <span style={{ fontSize: '1rem' }}>{icon}</span>{label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.6rem 0.875rem', borderRadius: 'var(--radius)',
              fontWeight: 500, fontSize: '0.875rem', color: isActive ? '#c084fc' : 'var(--text-sub)',
              background: isActive ? 'rgba(192,132,252,0.12)' : 'transparent',
              textDecoration: 'none', transition: 'all var(--transition)',
            })}>
              <span style={{ fontSize: '1rem' }}>⬡</span>Admin
            </NavLink>
          )}
        </nav>

        {/* User info */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '0.25rem', fontWeight: 500 }}>{user?.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', wordBreak: 'break-all' }}>{user?.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span className={`badge ${user?.role === 'admin' ? '' : 'badge-done'}`} style={user?.role === 'admin' ? { background: 'rgba(192,132,252,0.15)', color: '#c084fc' } : {}}>
              {user?.role}
            </span>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} className="btn-ghost w-full" style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
            {loggingOut ? '...' : '→ Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: '2rem', overflowX: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  );
}
