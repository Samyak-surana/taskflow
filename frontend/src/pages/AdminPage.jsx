import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../utils/api';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminApi.listUsers({ page, limit: 15 }),
        adminApi.platformStats(),
      ]);
      setUsers(usersRes.data.data);
      setPagination(usersRes.data.pagination);
      setPlatformStats(statsRes.data.data);
    } catch (_) {}
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = async (id) => {
    setActionLoading(id + 'toggle');
    try {
      await adminApi.toggleUser(id);
      loadData();
      showToast('User status updated.');
    } catch (_) {}
    finally { setActionLoading(null); }
  };

  const handleRole = async (id, role) => {
    setActionLoading(id + 'role');
    try {
      await adminApi.updateRole(id, role);
      loadData();
      showToast('Role updated.');
    } catch (_) {}
    finally { setActionLoading(null); }
  };

  return (
    <div style={{ maxWidth: 950 }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: 'var(--success)', color: '#0a0f1e', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', fontWeight: 600, zIndex: 300, boxShadow: 'var(--shadow)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Admin Panel</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.3rem' }}>Manage users and platform settings</p>
      </div>

      {/* Platform Stats */}
      {platformStats && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {[
            { label: 'Total Users', value: platformStats.users?.total, color: '#c084fc' },
            { label: 'Admins', value: platformStats.users?.admins, color: '#c084fc' },
            { label: 'Regular Users', value: platformStats.users?.regular, color: 'var(--text-sub)' },
            { label: 'Total Tasks', value: platformStats.tasks?.total, color: 'var(--accent)' },
            { label: 'Active Tasks', value: platformStats.tasks?.active, color: 'var(--accent)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem' }}>All Users</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pagination.total} total</div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span className="badge" style={u.role === 'admin' ? { background: 'rgba(192,132,252,0.15)', color: '#c084fc' } : { background: 'var(--bg-card2)', color: 'var(--text-sub)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span className={`badge ${u.is_active ? 'badge-done' : 'badge-archived'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          disabled={actionLoading === u.id + 'toggle'}
                          onClick={() => handleToggle(u.id)}>
                          {actionLoading === u.id + 'toggle' ? '...' : u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: u.role === 'admin' ? 'var(--warning)' : 'var(--accent2)' }}
                          disabled={actionLoading === u.id + 'role'}
                          onClick={() => handleRole(u.id, u.role === 'admin' ? 'user' : 'admin')}>
                          {actionLoading === u.id + 'role' ? '...' : u.role === 'admin' ? '→ User' : '→ Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{page} / {pagination.totalPages}</span>
            <button className="btn-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
