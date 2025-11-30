import { useEffect, useMemo, useState } from 'react';
import { AttendanceApi, ManagerApi } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

type TodayItem = { id: string; userId: string; date: string; status: string; checkInTime?: string; checkOutTime?: string };

export default function ManagerDashboardPage() {
  const [records, setRecords] = useState<TodayItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [employeeId, setEmployeeId] = useState<string>('');
  const [monthly, setMonthly] = useState<any[]>([]);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [weekly, setWeekly] = useState<any[]>([]);

  const userMap = useMemo(() => {
    const m: Record<string, any> = {};
    for (const u of users) m[u.id] = u;
    return m;
  }, [users]);

  async function load() {
    setError(null);
    try {
      const { data } = await ManagerApi.todayStatus();
      setRecords(data.records || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load');
    }
  }

  function rangeFromMonth(m: string) {
    const [y, mm] = m.split('-').map((x) => Number(x));
    const from = `${m}-01`;
    const endDate = new Date(y, mm, 0).toISOString().slice(0, 10);
    const to = endDate;
    return { from, to };
  }

  async function loadMonthly() {
    setMonthlyError(null);
    setLoadingMonthly(true);
    try {
      const { from, to } = rangeFromMonth(month);
      const params: any = { from, to };
      if (employeeId) params.employeeId = employeeId;
      const { data } = await ManagerApi.all(params);
      setMonthly(data.records || []);
    } catch (e: any) {
      setMonthlyError(e?.response?.data?.message || 'Failed to load month');
    } finally {
      setLoadingMonthly(false);
    }
  }

  function formatISO(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  async function loadWeekly() {
    try {
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(today.getDate() - 6);
      const { data } = await ManagerApi.all({ from: formatISO(fromDate), to: formatISO(today) });
      setWeekly(data.records || []);
    } catch {}
  }

  useEffect(() => {
    (async () => { try { const { data } = await ManagerApi.users(); setUsers(data.users || []); } catch {} })();
    load();
    loadWeekly();
  }, []);

  useEffect(() => {
    loadMonthly();
  }, [month, employeeId]);

  const summary = useMemo(() => {
    const s: Record<string, number> = { present: 0, late: 0, 'half-day': 0 };
    for (const r of records) s[r.status] = (s[r.status] || 0) + 1;
    return s;
  }, [records]);

  const monthlySummary = useMemo(() => {
    const s: any = { present: 0, late: 0, 'half-day': 0, totalHours: 0 };
    for (const r of monthly) {
      s[r.status] = (s[r.status] || 0) + 1;
      s.totalHours += r.totalHours || 0;
    }
    return s;
  }, [monthly]);

  const perEmployee = useMemo(() => {
    const by: Record<string, { employeeId: string; name: string; hours: number; present: number; late: number; half: number }> = {};
    for (const r of monthly) {
      const u = userMap[r.userId];
      const key = r.userId;
      if (!by[key]) by[key] = { employeeId: u?.employeeId || key, name: u?.name || key, hours: 0, present: 0, late: 0, half: 0 };
      by[key].hours += r.totalHours || 0;
      if (r.status === 'present') by[key].present++;
      if (r.status === 'late') by[key].late++;
      if (r.status === 'half-day') by[key].half++;
    }
    return Object.values(by).sort((a, b) => (a.hours < b.hours ? 1 : -1));
  }, [monthly, userMap]);

  const totalEmployees = useMemo(() => users.filter((u) => u.role === 'employee').length, [users]);

  const weeklyTrend = useMemo(() => {
    const days: Record<string, { present: number; late: number; half: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days[formatISO(d)] = { present: 0, late: 0, half: 0 };
    }
    for (const r of weekly) {
      const bucket = days[r.date];
      if (!bucket) continue;
      if (r.status === 'present') bucket.present++;
      if (r.status === 'late') bucket.late++;
      if (r.status === 'half-day') bucket.half++;
    }
    return Object.entries(days).map(([date, v]) => ({ date, ...v }));
  }, [weekly]);

  const departmentStats = useMemo(() => {
    const byDept: Record<string, number> = {};
    for (const r of monthly) {
      const u = userMap[r.userId];
      const dept = u?.department || 'Unknown';
      if (r.status === 'present' || r.status === 'late' || r.status === 'half-day') byDept[dept] = (byDept[dept] || 0) + 1;
    }
    return Object.entries(byDept).map(([department, count]) => ({ department, count })).sort((a, b) => (a.count < b.count ? 1 : -1));
  }, [monthly, userMap]);

  const absentToday = useMemo(() => {
    const todayIds = new Set(records.map((r) => r.userId));
    return users.filter((u) => u.role === 'employee' && !todayIds.has(u.id));
  }, [records, users]);

  return (
    <div className="stack">
      <h2 className="section-title">Manager Dashboard</h2>
      {error && <div className="label" style={{ color: 'var(--danger)' }}>{error}</div>}
      <div className="grid grid-3">
        <div className="card"><div className="label">Present Today</div><div style={{ fontSize: 24, fontWeight: 700 }}>{summary['present'] || 0}</div></div>
        <div className="card"><div className="label">Late Today</div><div style={{ fontSize: 24, fontWeight: 700 }}>{summary['late'] || 0}</div></div>
        <div className="card"><div className="label">Total Employees</div><div style={{ fontSize: 24, fontWeight: 700 }}>{totalEmployees}</div></div>
      </div>
      <div className="card stack">
        <h3 className="section-title">Today Status</h3>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{userMap[r.userId]?.name ? `${userMap[r.userId].name} (${userMap[r.userId].employeeId})` : r.userId}</td>
                <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                <td>{r.checkInTime || '-'}</td>
                <td>{r.checkOutTime || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card stack">
        <h3 className="section-title">Weekly Attendance Trend</h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={weeklyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="late" stroke="#60a5fa" strokeWidth={2} />
              <Line type="monotone" dataKey="half" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card stack">
        <h3 className="section-title">Monthly Overview</h3>
        <div className="row">
          <div className="field" style={{ minWidth: 220 }}>
            <label className="label">Month</label>
            <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="field" style={{ minWidth: 280 }}>
            <label className="label">Employee</label>
            <select className="select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">All</option>
              {users.map((u) => (
                <option key={u.id} value={u.employeeId}>{u.name} ({u.employeeId})</option>
              ))}
            </select>
          </div>
        </div>
        {monthlyError && <div className="label" style={{ color: 'var(--danger)' }}>{monthlyError}</div>}
        <div className="grid grid-3">
          <div className="card"><div className="label">Total Hours</div><div style={{ fontSize: 24, fontWeight: 700 }}>{monthlySummary.totalHours.toFixed(2)}</div></div>
          <div className="card"><div className="label">Present</div><div style={{ fontSize: 24, fontWeight: 700 }}>{monthlySummary['present'] || 0}</div></div>
          <div className="card"><div className="label">Late / Half-day</div><div style={{ fontSize: 24, fontWeight: 700 }}>{(monthlySummary['late'] || 0) + (monthlySummary['half-day'] || 0)}</div></div>
        </div>

        <div className="stack">
          <div className="label">Status distribution</div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[
                  { name: 'present', value: monthlySummary['present'] || 0 },
                  { name: 'late', value: monthlySummary['late'] || 0 },
                  { name: 'half-day', value: monthlySummary['half-day'] || 0 },
                ]} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  <Cell fill="#22c55e" />
                  <Cell fill="#60a5fa" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {!employeeId && (
          <div className="stack">
            <div className="label">Total hours by employee</div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={perEmployee} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <XAxis dataKey="employeeId" angle={-20} dy={20} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" fill="#6c8cff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="label">Department-wise attendance</div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={departmentStats} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <XAxis dataKey="department" angle={-20} dy={20} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {employeeId && (
          <div className="stack">
            <div className="label">Employee breakdown</div>
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
                {monthly.map((r) => (
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
        )}
      </div>

      <div className="card stack">
        <h3 className="section-title">Absent Employees Today</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {absentToday.map((u) => (
            <li key={u.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{u.name} ({u.employeeId})</span>
              <span className="badge absent">absent</span>
            </li>
          ))}
          {absentToday.length === 0 && <span className="muted">No absences recorded</span>}
        </ul>
      </div>
    </div>
  );
}
