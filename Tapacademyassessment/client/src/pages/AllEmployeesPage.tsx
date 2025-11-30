import { useEffect, useMemo, useState } from 'react';
import { ManagerApi } from '../services/api';

export default function AllEmployeesPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const userMap = useMemo(() => {
    const m: Record<string, any> = {};
    for (const u of users) m[u.id] = u;
    return m;
  }, [users]);

  async function loadUsers() {
    try {
      const { data } = await ManagerApi.users();
      setUsers(data.users || []);
    } catch (e) {}
  }

  async function refresh() {
    setError(null);
    try {
      const { data } = await ManagerApi.all({ from, to, employeeId, status });
      setRecords(data.records || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load');
    }
  }

  useEffect(() => {
    loadUsers();
    refresh();
  }, []);

  async function exportCSV() {
    const res = await ManagerApi.export({ from, to, employeeId });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="stack">
      <h2 className="section-title">All Employees Attendance</h2>
      <div className="card row" style={{ alignItems: 'center' }}>
        <input className="input" placeholder="From YYYY-MM-DD" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="input" placeholder="To YYYY-MM-DD" value={to} onChange={(e) => setTo(e.target.value)} />
        <select className="select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">All Employees</option>
          {users.map((u) => (
            <option key={u.id} value={u.employeeId}>{u.name} ({u.employeeId})</option>
          ))}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="half-day">Half-day</option>
        </select>
        <button className="btn btn-primary" onClick={refresh}>Apply Filters</button>
        <button className="btn" onClick={exportCSV}>Export CSV</button>
      </div>
      {error && <div className="label" style={{ color: 'var(--danger)' }}>{error}</div>}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{userMap[r.userId]?.name ? `${userMap[r.userId].name} (${userMap[r.userId].employeeId})` : r.userId}</td>
                <td>{r.date}</td>
                <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                <td>{r.checkInTime || '-'}</td>
                <td>{r.checkOutTime || '-'}</td>
                <td>{r.totalHours ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}