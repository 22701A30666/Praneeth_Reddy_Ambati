import { useState } from 'react';
import { AuthApi } from '../services/api';
import { useAuthStore } from '../store/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await AuthApi.login(email, password);
      setAuth(data.user, data.token);
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card stack">
        <h2 className="section-title">Welcome back</h2>

        <form className="stack" onSubmit={submit} autoComplete="off">
          {/* dummy fields to soak up browser autofill */}
          <input
            type="text"
            name="email"
            autoComplete="username"
            style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
            tabIndex={-1}
          />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
            tabIndex={-1}
          />

          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              name="real-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              name="real-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="label" style={{ color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="row">
            <button className="btn btn-primary" type="submit">
              Login
            </button>
            <a href="/register" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Create account
            </a>
          </div>
        </form>

        <p className="muted">
          Sample: manager@example.com, emp1@example.com … emp5@example.com (password123)
        </p>
      </div>
    </div>
  );
}
