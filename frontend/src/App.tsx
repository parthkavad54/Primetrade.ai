import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiRequest, type ApiTask, type ApiUser } from './api';

type AuthMode = 'login' | 'register';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
type TaskForm = {
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
};

const emptyAuthForm = {
  name: '',
  email: '',
  password: ''
};

const emptyTaskForm = {
  title: '',
  description: '',
  status: 'TODO' as TaskStatus,
  dueDate: ''
};

const statusMeta: Record<TaskStatus, { label: string; tone: string; summary: string }> = {
  TODO: {
    label: 'To do',
    tone: 'status-todo',
    summary: 'Ready to start'
  },
  IN_PROGRESS: {
    label: 'In progress',
    tone: 'status-progress',
    summary: 'Work in motion'
  },
  DONE: {
    label: 'Done',
    tone: 'status-done',
    summary: 'Completed work'
  }
};

function formatDate(value: string | null) {
  if (!value) {
    return 'No due date';
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>('register');
  const [session, setSession] = useState<ApiUser | null>(null);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const taskCount = useMemo(() => tasks.length, [tasks]);
  const doneCount = useMemo(() => tasks.filter((task) => task.status === 'DONE').length, [tasks]);
  const inProgressCount = useMemo(
    () => tasks.filter((task) => task.status === 'IN_PROGRESS').length,
    [tasks]
  );
  const todoCount = useMemo(() => tasks.filter((task) => task.status === 'TODO').length, [tasks]);
  const taskStats = useMemo(
    () => [
      {
        label: 'Total tasks',
        value: taskCount,
        summary: 'Visible in your current workspace'
      },
      {
        label: 'To do',
        value: todoCount,
        summary: 'Ready to pick up'
      },
      {
        label: 'In progress',
        value: inProgressCount,
        summary: 'Currently being worked on'
      },
      {
        label: 'Done',
        value: doneCount,
        summary: 'Finished and archived'
      }
    ],
    [taskCount, todoCount, inProgressCount, doneCount]
  );
  const workspaceLabel = session ? `${session.role} workspace` : 'Guest workspace';

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const currentUser = await apiRequest<{ user: ApiUser }>('/api/v1/auth/me');
      setSession(currentUser.user);
      await refreshTasks();
    } catch {
      setSession(null);
    }
  }

  async function refreshTasks() {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('search', query.trim());
    }
    if (statusFilter) {
      params.set('status', statusFilter);
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const result = await apiRequest<{ tasks: ApiTask[] }>(`/api/v1/tasks${suffix}`);
    setTasks(result.tasks);
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    try {
      const payload =
        mode === 'register'
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password
            };

      const result = await apiRequest<{ user: ApiUser }>(
        mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      );

      setSession(result.user);
      setAuthForm(emptyAuthForm);
      await refreshTasks();
      setNotice({
        type: 'success',
        text: mode === 'register' ? 'Account created and signed in.' : 'Welcome back.'
      });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Authentication failed'
      });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
      setSession(null);
      setTasks([]);
      setEditingTaskId(null);
      setTaskForm(emptyTaskForm);
      setNotice({ type: 'success', text: 'Signed out.' });
    } finally {
      setBusy(false);
    }
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null
      };

      if (editingTaskId) {
        await apiRequest(`/api/v1/tasks/${editingTaskId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setNotice({ type: 'success', text: 'Task updated.' });
      } else {
        await apiRequest('/api/v1/tasks', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setNotice({ type: 'success', text: 'Task created.' });
      }

      setTaskForm(emptyTaskForm);
      setEditingTaskId(null);
      await refreshTasks();
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Task save failed'
      });
    } finally {
      setBusy(false);
    }
  }

  function startEditing(task: ApiTask) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
    });
  }

  async function deleteTask(taskId: string) {
    setBusy(true);
    try {
      await apiRequest(`/api/v1/tasks/${taskId}`, { method: 'DELETE' });
      await refreshTasks();
      setNotice({ type: 'success', text: 'Task removed.' });
      if (editingTaskId === taskId) {
        setEditingTaskId(null);
        setTaskForm(emptyTaskForm);
      }
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Delete failed'
      });
    } finally {
      setBusy(false);
    }
  }

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await refreshTasks();
  }

  return (
    <div className="shell">
      <div className="backdrop backdrop-one" />
      <div className="backdrop backdrop-two" />

      <main className="page">
        <header className="masthead">
          <div className="brand-block">
            <div className="brand-mark">P</div>
            <div>
              <p className="eyebrow">Primetrade.ai assignment</p>
              <h1>Task management that feels calm, clear, and review-ready.</h1>
              <p className="masthead-copy">
                A small workspace for authentication, role-aware task CRUD, and a smoother reviewer
                demo.
              </p>
            </div>
          </div>

          <div className="status-strip">
            <span className="status-chip">Backend connected</span>
            <span className="status-chip">HttpOnly cookies</span>
            <span className="status-chip">{workspaceLabel}</span>
          </div>
        </header>

        <section className="card hero">
          <div className="hero-copy-block">
            <p className="eyebrow">Workspace summary</p>
            <p className="hero-copy">
              Keep the left side for account context, task filters, and task entry. The right side
              stays focused on the live list so the interface feels less crowded.
            </p>
          </div>

          <div className="hero-stats">
            {taskStats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <p>{stat.summary}</p>
              </div>
            ))}
          </div>
        </section>

        {notice && (
          <div className={`notice ${notice.type}`} role="status" aria-live="polite">
            {notice.text}
          </div>
        )}

        {!session ? (
          <section className="grid auth-grid">
            <form className="card panel auth-panel" onSubmit={submitAuth}>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Account access</p>
                  <h2>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
                  <p className="section-copy">
                    Use the seeded account for a quick review, or create a fresh account to test the
                    full flow.
                  </p>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                >
                  Switch to {mode === 'register' ? 'login' : 'register'}
                </button>
              </div>

              {mode === 'register' && (
                <label>
                  Name
                  <input
                    value={authForm.name}
                    onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                    placeholder="Alex Carter"
                    required
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                  placeholder="you@company.com"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                  placeholder="Minimum 8 characters"
                  required
                />
              </label>

              <button className="primary-button" disabled={busy} type="submit">
                {busy ? 'Working...' : mode === 'register' ? 'Create account' : 'Sign in'}
              </button>

              <div className="helper-card">
                <strong>Seed accounts</strong>
                <p>Admin: admin@primetrade.ai / Admin123!</p>
                <p>Demo user: demo@primetrade.ai / DemoUser123!</p>
              </div>
            </form>

            <aside className="card panel info-panel">
              <p className="eyebrow">Designed for review</p>
              <ul className="feature-list">
                <li>
                  <strong>Clear flow</strong>
                  <span>Short forms, plain language, and obvious call-to-action placement.</span>
                </li>
                <li>
                  <strong>Role aware</strong>
                  <span>Users see only what they should, while admins can review more broadly.</span>
                </li>
                <li>
                  <strong>Fast feedback</strong>
                  <span>Errors and success states are visible immediately without visual noise.</span>
                </li>
              </ul>

              <div className="helper-card soft">
                <strong>Quick demo</strong>
                <p>Admin: admin@primetrade.ai / Admin123!</p>
                <p>User: demo@primetrade.ai / DemoUser123!</p>
              </div>
            </aside>
          </section>
        ) : (
          <section className="workspace-grid">
            <aside className="card panel sidebar-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Signed in</p>
                  <h2>{session.name}</h2>
                </div>
                <button className="ghost-button" onClick={logout} disabled={busy} type="button">
                  Sign out
                </button>
              </div>
              <p className="muted">{session.email}</p>
              <p className="role-pill">Role: {session.role}</p>

              <div className="summary-grid">
                {taskStats.map((stat) => (
                  <div className="summary-card" key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                    <p>{stat.summary}</p>
                  </div>
                ))}
              </div>

              <div className="filter-card">
                <div className="panel-subheader">
                  <p className="eyebrow">Filters</p>
                  <span className="mini-note">Search and status</span>
                </div>

                <form onSubmit={applyFilters} className="stack-form">
                  <label>
                    Search
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search tasks"
                    />
                  </label>

                  <label>
                    Status
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option value="">All statuses</option>
                      <option value="TODO">Todo</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </label>

                  <button className="secondary-button" type="submit">
                    Apply filters
                  </button>
                </form>
              </div>
            </aside>

            <section className="content-stack">
              <form className="card panel task-form" onSubmit={submitTask}>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Task editor</p>
                    <h2>{editingTaskId ? 'Update task' : 'Create task'}</h2>
                    <p className="section-copy">
                      Keep titles short, add details only when they help someone act faster.
                    </p>
                  </div>
                  {editingTaskId && (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingTaskId(null);
                        setTaskForm(emptyTaskForm);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <label>
                  Title
                  <input
                    value={taskForm.title}
                    onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                    placeholder="Task title"
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={taskForm.description}
                    onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
                    placeholder="Optional details"
                    rows={4}
                  />
                </label>

                <div className="split-inputs">
                  <label>
                    Status
                    <select
                      value={taskForm.status}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          status: event.target.value as TaskStatus
                        })
                      }
                    >
                      <option value="TODO">Todo</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </label>

                  <label>
                    Due date
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                    />
                  </label>
                </div>

                <button className="primary-button" disabled={busy} type="submit">
                  {busy ? 'Working...' : editingTaskId ? 'Save changes' : 'Add task'}
                </button>
              </form>

              <section className="card panel task-list-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Task list</p>
                    <h2>Live workspace</h2>
                    <p className="section-copy">The list is designed for quick scanning and faster edits.</p>
                  </div>
                  <button className="ghost-button" onClick={() => void refreshTasks()} type="button">
                    Refresh
                  </button>
                </div>

                <div className="task-list">
                  {tasks.length === 0 ? (
                    <div className="empty-state">
                      <strong>No tasks found</strong>
                      <p>Create the first one or loosen the filters.</p>
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const status = statusMeta[task.status];

                      return (
                        <article className="task-card" key={task.id}>
                          <div className="task-topline">
                            <div>
                              <h3>{task.title}</h3>
                              <p>{task.description || 'No description provided.'}</p>
                            </div>
                            <span className={`status-pill ${status.tone}`}>{status.label}</span>
                          </div>

                          <div className="task-meta-grid">
                            <div>
                              <span>Due date</span>
                              <strong>{formatDate(task.dueDate)}</strong>
                            </div>
                            <div>
                              <span>Owner</span>
                              <strong>{task.owner.name}</strong>
                            </div>
                            <div>
                              <span>Access</span>
                              <strong>{task.owner.role}</strong>
                            </div>
                          </div>

                          <div className="task-footer">
                            <p>{status.summary}</p>
                            <div className="task-actions">
                              <button className="secondary-button" type="button" onClick={() => startEditing(task)}>
                                Edit
                              </button>
                              <button
                                className="danger-button"
                                type="button"
                                onClick={() => void deleteTask(task.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}