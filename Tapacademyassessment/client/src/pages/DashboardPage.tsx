import { useEffect, useState } from 'react';
import { AttendanceApi } from '../services/api';
import { useAuthStore } from '../store/auth';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [today, setToday] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState<any>({ present: 0, absent: 0, late: 0, 'half-day': 0, totalHours: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  async function refresh() {
    const { data } = await AttendanceApi.today();
    setToday(data.record);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await AttendanceApi.mySummary(month);
      setSummary(data.summary || { present: 0, absent: 0, late: 0, 'half-day': 0, totalHours: 0 });
    })();
    (async () => {
      const { data } = await AttendanceApi.myHistory(month);
      const last7 = data.records.slice(0, 7);
      setRecent(last7);
    })();
  }, [month]);

  async function checkin() {
    setMessage(null);
    try {
      await AttendanceApi.checkin();
      await refresh();
      setMessage('Checked in successfully');
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Check-in failed');
    }
  }

  async function checkout() {
    setMessage(null);
    try {
      await AttendanceApi.checkout();
      await refresh();
      setMessage('Checked out successfully');
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Check-out failed');
    }
  }

  return (
    <div className="stack">
      <h2 className="section-title">Dashboard</h2>
      <p className="muted">Hello, {user?.name}</p>
      <div className="card stack" style={{ maxWidth: 540 }}>
        <h3 className="section-title">Today</h3>
        <p>Status: <span className={`badge ${today?.status || 'absent'}`}>{today?.status ?? 'Not checked-in'}</span></p>
        <div className="grid grid-2">
          <div>
            <div className="label">Check In</div>
            <div>{today?.checkInTime ?? '-'}</div>
          </div>
          <div>
            <div className="label">Check Out</div>
            <div>{today?.checkOutTime ?? '-'}</div>
          </div>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={checkin} disabled={!!today?.checkInTime}>Check In</button>
          <button className="btn" onClick={checkout} disabled={!today?.checkInTime || !!today?.checkOutTime}>Check Out</button>
        </div>
        {message && <p className="label" style={{ color: 'var(--success)' }}>{message}</p>}
      </div>

      <div className="card stack">
        <h3 className="section-title">This Month</h3>
        <div className="row">
          <div className="field" style={{ minWidth: 220 }}>
            <label className="label">Month</label>
            <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-3">
          <div className="card"><div className="label">Present</div><div style={{ fontSize: 24, fontWeight: 700 }}>{summary.present}</div></div>
          <div className="card"><div className="label">Absent</div><div style={{ fontSize: 24, fontWeight: 700 }}>{summary.absent}</div></div>
          <div className="card"><div className="label">Late</div><div style={{ fontSize: 24, fontWeight: 700 }}>{summary.late}</div></div>
        </div>
        <div className="card"><div className="label">Total Hours</div><div style={{ fontSize: 24, fontWeight: 700 }}>{Number(summary.totalHours || 0).toFixed(2)}</div></div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={[
                { name: 'Present', value: summary.present },
                { name: 'Absent', value: summary.absent },
                { name: 'Late', value: summary.late },
                { name: 'Half-day', value: summary['half-day'] || 0 },
              ]} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
                <Cell fill="#60a5fa" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card stack">
        <h3 className="section-title">Recent Attendance (last 7 days)</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={recent.map((r) => ({ date: r.date, hours: r.totalHours || 0 }))} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <XAxis dataKey="date" angle={-20} dy={20} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#6c8cff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                <td>{r.checkInTime || '-'}</td>
                <td>{r.checkOutTime || '-'}</td>
                <td>{(r.totalHours || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
