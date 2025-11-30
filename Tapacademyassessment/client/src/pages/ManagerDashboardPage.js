import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { ManagerApi } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
export default function ManagerDashboardPage() {
    const [records, setRecords] = useState([]);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [employeeId, setEmployeeId] = useState('');
    const [monthly, setMonthly] = useState([]);
    const [monthlyError, setMonthlyError] = useState(null);
    const [loadingMonthly, setLoadingMonthly] = useState(false);
    const [weekly, setWeekly] = useState([]);
    const userMap = useMemo(() => {
        const m = {};
        for (const u of users)
            m[u.id] = u;
        return m;
    }, [users]);
    async function load() {
        setError(null);
        try {
            const { data } = await ManagerApi.todayStatus();
            setRecords(data.records || []);
        }
        catch (e) {
            setError(e?.response?.data?.message || 'Failed to load');
        }
    }
    function rangeFromMonth(m) {
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
            const params = { from, to };
            if (employeeId)
                params.employeeId = employeeId;
            const { data } = await ManagerApi.all(params);
            setMonthly(data.records || []);
        }
        catch (e) {
            setMonthlyError(e?.response?.data?.message || 'Failed to load month');
        }
        finally {
            setLoadingMonthly(false);
        }
    }
    function formatISO(d) {
        return d.toISOString().slice(0, 10);
    }
    async function loadWeekly() {
        try {
            const today = new Date();
            const fromDate = new Date(today);
            fromDate.setDate(today.getDate() - 6);
            const { data } = await ManagerApi.all({ from: formatISO(fromDate), to: formatISO(today) });
            setWeekly(data.records || []);
        }
        catch { }
    }
    useEffect(() => {
        (async () => { try {
            const { data } = await ManagerApi.users();
            setUsers(data.users || []);
        }
        catch { } })();
        load();
        loadWeekly();
    }, []);
    useEffect(() => {
        loadMonthly();
    }, [month, employeeId]);
    const summary = useMemo(() => {
        const s = { present: 0, late: 0, 'half-day': 0 };
        for (const r of records)
            s[r.status] = (s[r.status] || 0) + 1;
        return s;
    }, [records]);
    const monthlySummary = useMemo(() => {
        const s = { present: 0, late: 0, 'half-day': 0, totalHours: 0 };
        for (const r of monthly) {
            s[r.status] = (s[r.status] || 0) + 1;
            s.totalHours += r.totalHours || 0;
        }
        return s;
    }, [monthly]);
    const perEmployee = useMemo(() => {
        const by = {};
        for (const r of monthly) {
            const u = userMap[r.userId];
            const key = r.userId;
            if (!by[key])
                by[key] = { employeeId: u?.employeeId || key, name: u?.name || key, hours: 0, present: 0, late: 0, half: 0 };
            by[key].hours += r.totalHours || 0;
            if (r.status === 'present')
                by[key].present++;
            if (r.status === 'late')
                by[key].late++;
            if (r.status === 'half-day')
                by[key].half++;
        }
        return Object.values(by).sort((a, b) => (a.hours < b.hours ? 1 : -1));
    }, [monthly, userMap]);
    const totalEmployees = useMemo(() => users.filter((u) => u.role === 'employee').length, [users]);
    const weeklyTrend = useMemo(() => {
        const days = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days[formatISO(d)] = { present: 0, late: 0, half: 0 };
        }
        for (const r of weekly) {
            const bucket = days[r.date];
            if (!bucket)
                continue;
            if (r.status === 'present')
                bucket.present++;
            if (r.status === 'late')
                bucket.late++;
            if (r.status === 'half-day')
                bucket.half++;
        }
        return Object.entries(days).map(([date, v]) => ({ date, ...v }));
    }, [weekly]);
    const departmentStats = useMemo(() => {
        const byDept = {};
        for (const r of monthly) {
            const u = userMap[r.userId];
            const dept = u?.department || 'Unknown';
            if (r.status === 'present' || r.status === 'late' || r.status === 'half-day')
                byDept[dept] = (byDept[dept] || 0) + 1;
        }
        return Object.entries(byDept).map(([department, count]) => ({ department, count })).sort((a, b) => (a.count < b.count ? 1 : -1));
    }, [monthly, userMap]);
    const absentToday = useMemo(() => {
        const todayIds = new Set(records.map((r) => r.userId));
        return users.filter((u) => u.role === 'employee' && !todayIds.has(u.id));
    }, [records, users]);
    return (_jsxs("div", { className: "stack", children: [_jsx("h2", { className: "section-title", children: "Manager Dashboard" }), error && _jsx("div", { className: "label", style: { color: 'var(--danger)' }, children: error }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Present Today" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: summary['present'] || 0 })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Late Today" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: summary['late'] || 0 })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Total Employees" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: totalEmployees })] })] }), _jsxs("div", { className: "card stack", children: [_jsx("h3", { className: "section-title", children: "Today Status" }), _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "User" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Check In" }), _jsx("th", { children: "Check Out" })] }) }), _jsx("tbody", { children: records.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: userMap[r.userId]?.name ? `${userMap[r.userId].name} (${userMap[r.userId].employeeId})` : r.userId }), _jsx("td", { children: _jsx("span", { className: `badge ${r.status}`, children: r.status }) }), _jsx("td", { children: r.checkInTime || '-' }), _jsx("td", { children: r.checkOutTime || '-' })] }, r.id))) })] })] }), _jsxs("div", { className: "card stack", children: [_jsx("h3", { className: "section-title", children: "Weekly Attendance Trend" }), _jsx("div", { style: { width: '100%', height: 280 }, children: _jsx(ResponsiveContainer, { children: _jsxs(LineChart, { data: weeklyTrend, margin: { top: 10, right: 20, left: 0, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "date", tickFormatter: (d) => d.slice(5) }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "present", stroke: "#22c55e", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "late", stroke: "#60a5fa", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "half", stroke: "#f59e0b", strokeWidth: 2 })] }) }) })] }), _jsxs("div", { className: "card stack", children: [_jsx("h3", { className: "section-title", children: "Monthly Overview" }), _jsxs("div", { className: "row", children: [_jsxs("div", { className: "field", style: { minWidth: 220 }, children: [_jsx("label", { className: "label", children: "Month" }), _jsx("input", { className: "input", type: "month", value: month, onChange: (e) => setMonth(e.target.value) })] }), _jsxs("div", { className: "field", style: { minWidth: 280 }, children: [_jsx("label", { className: "label", children: "Employee" }), _jsxs("select", { className: "select", value: employeeId, onChange: (e) => setEmployeeId(e.target.value), children: [_jsx("option", { value: "", children: "All" }), users.map((u) => (_jsxs("option", { value: u.employeeId, children: [u.name, " (", u.employeeId, ")"] }, u.id)))] })] })] }), monthlyError && _jsx("div", { className: "label", style: { color: 'var(--danger)' }, children: monthlyError }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Total Hours" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: monthlySummary.totalHours.toFixed(2) })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Present" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: monthlySummary['present'] || 0 })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Late / Half-day" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: (monthlySummary['late'] || 0) + (monthlySummary['half-day'] || 0) })] })] }), _jsxs("div", { className: "stack", children: [_jsx("div", { className: "label", children: "Status distribution" }), _jsx("div", { style: { width: '100%', height: 260 }, children: _jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsxs(Pie, { data: [
                                                    { name: 'present', value: monthlySummary['present'] || 0 },
                                                    { name: 'late', value: monthlySummary['late'] || 0 },
                                                    { name: 'half-day', value: monthlySummary['half-day'] || 0 },
                                                ], dataKey: "value", nameKey: "name", innerRadius: 50, outerRadius: 90, children: [_jsx(Cell, { fill: "#22c55e" }), _jsx(Cell, { fill: "#60a5fa" }), _jsx(Cell, { fill: "#f59e0b" })] }), _jsx(Tooltip, {}), _jsx(Legend, {})] }) }) })] }), !employeeId && (_jsxs("div", { className: "stack", children: [_jsx("div", { className: "label", children: "Total hours by employee" }), _jsx("div", { style: { width: '100%', height: 300 }, children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: perEmployee, margin: { top: 10, right: 20, left: 0, bottom: 40 }, children: [_jsx(XAxis, { dataKey: "employeeId", angle: -20, dy: 20 }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "hours", fill: "#6c8cff" })] }) }) }), _jsx("div", { className: "label", children: "Department-wise attendance" }), _jsx("div", { style: { width: '100%', height: 300 }, children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: departmentStats, margin: { top: 10, right: 20, left: 0, bottom: 40 }, children: [_jsx(XAxis, { dataKey: "department", angle: -20, dy: 20 }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "count", fill: "#22d3ee" })] }) }) })] })), employeeId && (_jsxs("div", { className: "stack", children: [_jsx("div", { className: "label", children: "Employee breakdown" }), _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Date" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Check In" }), _jsx("th", { children: "Check Out" }), _jsx("th", { children: "Hours" })] }) }), _jsx("tbody", { children: monthly.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: r.date }), _jsx("td", { children: _jsx("span", { className: `badge ${r.status}`, children: r.status }) }), _jsx("td", { children: r.checkInTime || '-' }), _jsx("td", { children: r.checkOutTime || '-' }), _jsx("td", { children: (r.totalHours || 0).toFixed(2) })] }, r.id))) })] })] }))] }), _jsxs("div", { className: "card stack", children: [_jsx("h3", { className: "section-title", children: "Absent Employees Today" }), _jsxs("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }, children: [absentToday.map((u) => (_jsxs("li", { className: "row", style: { justifyContent: 'space-between' }, children: [_jsxs("span", { children: [u.name, " (", u.employeeId, ")"] }), _jsx("span", { className: "badge absent", children: "absent" })] }, u.id))), absentToday.length === 0 && _jsx("span", { className: "muted", children: "No absences recorded" })] })] })] }));
}
