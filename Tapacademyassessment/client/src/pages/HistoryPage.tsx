import { useEffect, useState } from 'react';
import { AttendanceApi } from '../services/api';

export default function HistoryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [month, setMonth] = useState<string>('');

  async function refresh() {
    const { data } = await AttendanceApi.myHistory(month || undefined);
    setRecords(data.records);
  }

  useEffect(() => {
    refresh();
  }, [month]);

  return (
    <div className="stack">
      <h2 className="section-title">My Attendance History</h2>
      <div className="card row" style={{ alignItems: 'center' }}>
        <div className="field" style={{ maxWidth: 200 }}>
          <label className="label">Month (YYYY-MM)</label>
          <input className="input" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="2025-11" />
        </div>
        <button className="btn btn-primary" onClick={refresh}>Refresh</button>
      </div>
      <div className="card">
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
            {records.map((r) => (
              <tr key={r.id}>
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