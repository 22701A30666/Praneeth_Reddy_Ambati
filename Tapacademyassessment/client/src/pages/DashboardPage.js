import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AttendanceApi } from '../services/api';
import { useAuthStore } from '../store/auth';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
export default function DashboardPage() {
    const { user } = useAuthStore();
    const [today, setToday] = useState(null);
    const [message, setMessage] = useState(null);
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, 'half-day': 0, totalHours: 0 });
    const [recent, setRecent] = useState([]);
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
        }
        catch (e) {
            setMessage(e?.response?.data?.message || 'Check-in failed');
        }
    }
    async function checkout() {
        setMessage(null);
        try {
            await AttendanceApi.checkout();
            await refresh();
            setMessage('Checked out successfully');
        }
        catch (e) {
            setMessage(e?.response?.data?.message || 'Check-out failed');
        }
    }
    return (_jsxs("div", { className: "stack", children: [_jsx("h2", { className: "section-title", children: "Dashboard" }), _jsxs("p", { className: "muted", children: ["Hello, ", user?.name] }), _jsxs("div", { className: "card stack", style: { maxWidth: 540 }, children: [_jsx("h3", { className: "section-title", children: "Today" }), _jsxs("p", { children: ["Status: ", _jsx("span", { className: `badge ${today?.status || 'absent'}`, children: today?.status ?? 'Not checked-in' })] }), _jsxs("div", { className: "grid grid-2", children: [_jsxs("div", { children: [_jsx("div", { className: "label", children: "Check In" }), _jsx("div", { children: today?.checkInTime ?? '-' })] }), _jsxs("div", { children: [_jsx("div", { className: "label", children: "Check Out" }), _jsx("div", { children: today?.checkOutTime ?? '-' })] })] }), _jsxs("div", { className: "row", style: { marginTop: 8 }, children: [_jsx("button", { className: "btn btn-primary", onClick: checkin, disabled: !!today?.checkInTime, children: "Check In" }), _jsx("button", { className: "btn", onClick: checkout, disabled: !today?.checkInTime || !!today?.checkOutTime, children: "Check Out" })] }), message && _jsx("p", { className: "label", style: { color: 'var(--success)' }, children: message })] }), _jsxs("div", { className: "card stack", children: [_jsx("h3", { className: "section-title", children: "This Month" }), _jsx("div", { className: "row", children: _jsxs("div", { className: "field", style: { minWidth: 220 }, children: [_jsx("label", { className: "label", children: "Month" }), _jsx("input", { className: "input", type: "month", value: month, onChange: (e) => setMonth(e.target.value) })] }) }), _jsxs("div", { className: "grid grid-3", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Present" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: summary.present })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Absent" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: summary.absent })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Late" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: summary.late })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "label", children: "Total Hours" }), _jsx("div", { style: { fontSize: 24, fontWeight: 700 }, children: Number(summary.totalHours || 0).toFixed(2) })] }), _jsx("div", { style: { width: '100%', height: 260 }, children: _jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsxs(Pie, { data: [
                                            { name: 'Present', value: summary.present },
                                            { name: 'Absent', value: summary.absent },
                                            { name: 'Late', value: summary.late },
                                            { name: 'Half-day', value: summary['half-day'] || 0 },
                                        ], dataKey: "value", nameKey: "name", innerRadius: 50, outerRadius: 90, children: [_jsx(Cell, { fill: "#22c55e" }), _jsx(Cell, { fill: "#ef4444" }), _jsx(Cell, { fill: "#60a5fa" }), _jsx(Cell, { fill: "#f59e0b" })] }), _jsx(Tooltip, {}), _jsx(Legend, {})] }) }) })] }), _jsxs("div", { className: "card stack", children: [_jsx("h3", { className: "section-title", children: "Recent Attendance (last 7 days)" }), _jsx("div", { style: { width: '100%', height: 300 }, children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: recent.map((r) => ({ date: r.date, hours: r.totalHours || 0 })), margin: { top: 10, right: 20, left: 0, bottom: 40 }, children: [_jsx(XAxis, { dataKey: "date", angle: -20, dy: 20 }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "hours", fill: "#6c8cff" })] }) }) }), _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Date" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Check In" }), _jsx("th", { children: "Check Out" }), _jsx("th", { children: "Hours" })] }) }), _jsx("tbody", { children: recent.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: r.date }), _jsx("td", { children: _jsx("span", { className: `badge ${r.status}`, children: r.status }) }), _jsx("td", { children: r.checkInTime || '-' }), _jsx("td", { children: r.checkOutTime || '-' }), _jsx("td", { children: (r.totalHours || 0).toFixed(2) })] }, r.id))) })] })] })] }));
}
