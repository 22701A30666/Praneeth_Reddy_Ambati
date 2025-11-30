import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { ManagerApi } from '../services/api';
export default function TeamCalendarPage() {
    const [users, setUsers] = useState([]);
    const [employeeId, setEmployeeId] = useState('');
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [records, setRecords] = useState([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        (async () => { try {
            const { data } = await ManagerApi.users();
            setUsers(data.users || []);
        }
        catch { } })();
    }, []);
    function rangeFromMonth(m) {
        const [y, mm] = m.split('-').map((x) => Number(x));
        const from = `${m}-01`;
        const endDate = new Date(y, mm, 0).toISOString().slice(0, 10);
        const to = endDate;
        return { from, to };
    }
    async function load() {
        setError(null);
        try {
            if (!employeeId) {
                setRecords([]);
                return;
            }
            const { from, to } = rangeFromMonth(month);
            const { data } = await ManagerApi.employee(employeeId, { from, to });
            setRecords(data.records || []);
        }
        catch (e) {
            setError(e?.response?.data?.message || 'Failed to load');
        }
    }
    useEffect(() => { load(); }, [employeeId, month]);
    const byDate = useMemo(() => {
        const m = {};
        for (const r of records)
            m[r.date] = r;
        return m;
    }, [records]);
    const days = useMemo(() => {
        const [y, mm] = month.split('-').map((x) => Number(x));
        const first = new Date(Date.UTC(y, mm - 1, 1));
        const startDay = first.getUTCDay();
        const total = new Date(Date.UTC(y, mm, 0)).getUTCDate();
        const cells = [];
        for (let i = 0; i < startDay; i++)
            cells.push(null);
        for (let d = 1; d <= total; d++)
            cells.push(d);
        return cells;
    }, [month]);
    return (_jsxs("div", { className: "stack", children: [_jsx("h2", { className: "section-title", children: "Team Calendar View" }), _jsxs("div", { className: "card row", style: { alignItems: 'center' }, children: [_jsxs("div", { className: "field", style: { minWidth: 220 }, children: [_jsx("label", { className: "label", children: "Employee" }), _jsxs("select", { className: "select", value: employeeId, onChange: (e) => setEmployeeId(e.target.value), children: [_jsx("option", { value: "", children: "Select employee" }), users.filter((u) => u.role === 'employee').map((u) => (_jsxs("option", { value: u.employeeId, children: [u.name, " (", u.employeeId, ")"] }, u.id)))] })] }), _jsxs("div", { className: "field", style: { minWidth: 200 }, children: [_jsx("label", { className: "label", children: "Month" }), _jsx("input", { className: "input", type: "month", value: month, onChange: (e) => setMonth(e.target.value) })] })] }), error && _jsx("div", { className: "label", style: { color: 'var(--danger)' }, children: error }), _jsx("div", { className: "card", children: _jsxs("div", { className: "calendar", children: [['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (_jsx("div", { className: "calendar-head", children: w }, w))), days.map((d, idx) => {
                            if (!d)
                                return _jsx("div", { className: "calendar-cell" }, idx);
                            const date = `${month}-${String(d).padStart(2, '0')}`;
                            const rec = byDate[date];
                            const status = rec?.status || 'absent';
                            return (_jsxs("div", { className: `calendar-cell day ${status}`, title: status, children: [_jsx("div", { className: "day-num", children: d }), _jsx("div", { className: "day-status", children: _jsx("span", { className: `badge ${status}`, children: status }) })] }, idx));
                        })] }) })] }));
}
