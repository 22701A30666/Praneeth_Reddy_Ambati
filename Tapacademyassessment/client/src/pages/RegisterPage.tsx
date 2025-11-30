import { useState } from 'react';
import { AuthApi } from '../services/api';
import { useAuthStore } from '../store/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'manager'>('employee');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await AuthApi.register({ name, email, password, role, employeeId, department });
      setAuth(data.user, data.token);
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card stack">
        <h2 className="section-title">Create your account</h2>
        <form className="grid grid-2" onSubmit={submit}>
          <div className="field">
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Role</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Employee ID</label>
            <input className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP010" />
          </div>
          <div className="field">
            <label className="label">Department</label>
            <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          {error && <div className="label" style={{ color: 'var(--danger)' }}>{error}</div>}
          <div className="row" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" type="submit">Create Account</button>
            <a href="/login" className="btn" style={{ textDecoration: 'none' }}>Have an account? Login</a>
          </div>
        </form>
      </div>
    </div>
  );
}