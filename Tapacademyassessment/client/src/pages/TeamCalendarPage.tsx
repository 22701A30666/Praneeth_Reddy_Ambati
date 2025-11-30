import { useEffect, useMemo, useState } from 'react';
import { ManagerApi } from '../services/api';

export default function TeamCalendarPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => { try { const { data } = await ManagerApi.users(); setUsers(data.users || []); } catch {} })();
  }, []);

  function rangeFromMonth(m: string) {
    const [y, mm] = m.split('-').map((x) => Number(x));
    const from = `${m}-01`;
    const endDate = new Date(y, mm, 0).toISOString().slice(0, 10);
    const to = endDate;
    return { from, to };
  }

  async function load() {
    setError(null);
    try {
      if (!employeeId) { setRecords([]); return; }
      const { from, to } = rangeFromMonth(month);
      const { data } = await ManagerApi.employee(employeeId, { from, to });
      setRecords(data.records || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load');
    }
  }

  useEffect(() => { load(); }, [employeeId, month]);

  const byDate = useMemo(() => {
    const m: Record<string, any> = {};
    for (const r of records) m[r.date] = r;
    return m;
  }, [records]);

  const days = useMemo(() => {
    const [y, mm] = month.split('-').map((x) => Number(x));
    const first = new Date(Date.UTC(y, mm - 1, 1));
    const startDay = first.getUTCDay();
    const total = new Date(Date.UTC(y, mm, 0)).getUTCDate();
    const cells: any[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [month]);

  return (
    <div className="stack">
      <h2 className="section-title">Team Calendar View</h2>
      <div className="card row" style={{ alignItems: 'center' }}>
        <div className="field" style={{ minWidth: 220 }}>
          <label className="label">Employee</label>
          <select className="select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select employee</option>
            {users.filter((u) => u.role === 'employee').map((u) => (
              <option key={u.id} value={u.employeeId}>{u.name} ({u.employeeId})</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 200 }}>
          <label className="label">Month</label>
          <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      </div>
      {error && <div className="label" style={{ color: 'var(--danger)' }}>{error}</div>}
      <div className="card">
        <div className="calendar">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => (
            <div key={w} className="calendar-head">{w}</div>
          ))}
          {days.map((d, idx) => {
            if (!d) return <div key={idx} className="calendar-cell" />;
            const date = `${month}-${String(d).padStart(2,'0')}`;
            const rec = byDate[date];
            const status = rec?.status || 'absent';
            return (
              <div key={idx} className={`calendar-cell day ${status}`} title={status}>
                <div className="day-num">{d}</div>
                <div className="day-status"><span className={`badge ${status}`}>{status}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
