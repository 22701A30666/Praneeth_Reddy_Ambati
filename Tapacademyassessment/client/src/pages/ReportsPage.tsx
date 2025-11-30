import { useEffect, useMemo, useState } from 'react';
import { ManagerApi } from '../services/api';

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { (async () => { try { const { data } = await ManagerApi.users(); setUsers(data.users || []); } catch {} })(); }, []);

  async function refresh() {
    setError(null);
    try {
      const { data } = await ManagerApi.all({ from, to, employeeId });
      setRecords(data.records || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load');
    }
  }

  async function exportCSV() {
    const res = await ManagerApi.export({ from, to, employeeId });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const summary = useMemo(() => {
    const s: any = { present: 0, absent: 0, late: 0, 'half-day': 0, totalHours: 0 };
    for (const r of records) { s[r.status] = (s[r.status] || 0) + 1; s.totalHours += r.totalHours || 0; }
    return s;
  }, [records]);

  return (
    <div className="stack">
      <h2 className="section-title">Reports</h2>
      <div className="card row" style={{ alignItems: 'center' }}>
        <input className="input" placeholder="From YYYY-MM-DD" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="input" placeholder="To YYYY-MM-DD" value={to} onChange={(e) => setTo(e.target.value)} />
        <select className="select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">All Employees</option>
          {users.map((u) => (<option key={u.id} value={u.employeeId}>{u.name} ({u.employeeId})</option>))}
        </select>
        <button className="btn btn-primary" onClick={refresh}>Apply Filters</button>
        <button className="btn" onClick={exportCSV}>Export CSV</button>
      </div>
      {error && <div className="label" style={{ color: 'var(--danger)' }}>{error}</div>}
      <div className="grid grid-3">
        <div className="card"><div className="label">Present</div><div style={{ fontSize: 24, fontWeight: 700 }}>{summary.present}</div></div>
        <div className="card"><div className="label">Absent</div><div style={{ fontSize: 24, fontWeight: 700 }}>{summary.absent}</div></div>
        <div className="card"><div className="label">Late / Half-day</div><div style={{ fontSize: 24, fontWeight: 700 }}>{(summary.late || 0) + (summary['half-day'] || 0)}</div></div>
      </div>
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
                <td>{(() => { const u = users.find((x) => x.id === r.userId); return u ? `${u.name} (${u.employeeId})` : r.userId; })()}</td>
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
