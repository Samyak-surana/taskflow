import { useEffect, useState, useCallback } from 'react';
import { tasksApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'in_progress', 'done', 'archived'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const EMPTY_FORM = { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', tags: '' };

function TaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState(task ? {
    title: task.title, description: task.description || '', status: task.status,
    priority: task.priority, due_date: task.due_date || '', tags: (task.tags || []).join(', ')
  } : EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [], due_date: form.due_date || undefined };
      if (task) await tasksApi.update(task.id, payload);
      else await tasksApi.create(payload);
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.errors ? data.errors.map(e => e.message).join(', ') : data?.message || 'Failed to save task.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700 }}>{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Task title" />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="label">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Due Date</label>
            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span></label>
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="frontend, urgent, bug" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2 }}>
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: '', priority: '', search: '', sortBy: 'created_at', order: 'DESC' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await tasksApi.list(params);
      setTasks(data.data);
      setPagination(data.pagination);
    } catch (_) {}
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleSaved = () => { setModal(null); loadTasks(); showToast('Task saved!'); };

  const handleDelete = async (id) => {
    try {
      await tasksApi.delete(id);
      setDeleteConfirm(null);
      loadTasks();
      showToast('Task deleted.');
    } catch (_) {}
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: 'var(--success)', color: '#0a0f1e', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', fontWeight: 600, zIndex: 300, boxShadow: 'var(--shadow)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Tasks</h1>
        <button className="btn-primary" onClick={() => setModal('create')}>+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <input style={{ maxWidth: 200 }} placeholder="Search..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        <select style={{ maxWidth: 140 }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select style={{ maxWidth: 140 }} value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value, page: 1 })}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select style={{ maxWidth: 160 }} value={filters.sortBy} onChange={e => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}>
          <option value="created_at">Newest</option>
          <option value="due_date">Due Date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>◎</div>
          <p>No tasks found.</p>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setModal('create')}>Create your first task</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tasks.map((task) => (
            <div key={task.id} className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.925rem', marginBottom: '0.2rem' }}>{task.title}</div>
                  {task.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description}</div>}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.due_date && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📅 {task.due_date}</span>}
                    {task.tags?.map(tag => <span key={tag} style={{ fontSize: '0.72rem', color: 'var(--accent)', background: 'var(--accent-dim)', padding: '0.1rem 0.5rem', borderRadius: '99px' }}>#{tag}</span>)}
                    {isAdmin && task.user && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>by {task.user.name}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button className="btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setModal(task)}>Edit</button>
                  <button className="btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setDeleteConfirm(task.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="btn-secondary" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>← Prev</button>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {filters.page} / {pagination.totalPages}
          </span>
          <button className="btn-secondary" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next →</button>
        </div>
      )}

      {/* Modals */}
      {(modal === 'create' || (modal && modal.id)) && (
        <TaskModal task={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="card" style={{ maxWidth: 360, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>Delete task?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1, background: 'var(--danger)', color: '#fff' }} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
