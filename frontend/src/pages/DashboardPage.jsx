import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksApi, adminApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, color, sublabel }) => (
  <div className="card" style={{ flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 700, color: color || 'var(--text)', lineHeight: 1 }}>{value ?? '—'}</div>
    {sublabel && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{sublabel}</div>}
  </div>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [taskStats, setTaskStats] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          tasksApi.stats(),
          tasksApi.list({ limit: 5, sortBy: 'created_at', order: 'DESC' }),
        ]);
        setTaskStats(statsRes.data.data);
        setRecentTasks(tasksRes.data.data);

        if (isAdmin) {
          const pRes = await adminApi.platformStats();
          setPlatformStats(pRes.data.data);
        }
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, [isAdmin]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Task stats */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>Task Overview</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <StatCard label="Total" value={taskStats?.total} color="var(--text)" />
          <StatCard label="To Do" value={taskStats?.todo} color="var(--text-sub)" />
          <StatCard label="In Progress" value={taskStats?.inProgress} color="var(--accent)" />
          <StatCard label="Done" value={taskStats?.done} color="var(--success)" />
          <StatCard label="Archived" value={taskStats?.archived} color="var(--text-muted)" />
        </div>
      </section>

      {/* Admin platform stats */}
      {isAdmin && platformStats && (
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>Platform Stats <span style={{ color: '#c084fc' }}>(Admin)</span></div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <StatCard label="Total Users" value={platformStats?.users?.total} color="#c084fc" />
            <StatCard label="Admin Users" value={platformStats?.users?.admins} color="#c084fc" />
            <StatCard label="All Tasks" value={platformStats?.tasks?.total} color="var(--accent)" />
            <StatCard label="Active Tasks" value={platformStats?.tasks?.active} color="var(--accent)" />
          </div>
        </section>
      )}

      {/* Recent Tasks */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Tasks</div>
          <Link to="/tasks" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>View all →</Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>◎</div>
            <p>No tasks yet. <Link to="/tasks">Create your first task</Link></p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentTasks.map((task) => (
              <div key={task.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                  {task.due_date && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Due: {task.due_date}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
