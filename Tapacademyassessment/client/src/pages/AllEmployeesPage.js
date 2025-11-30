import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { ManagerApi } from '../services/api';
export default function AllEmployeesPage() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [status, setStatus] = useState('');
    const [records, setRecords] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const userMap = useMemo(() => {
        const m = {};
        for (const u of users)
            m[u.id] = u;
        return m;
    }, [users]);
    async function loadUsers() {
        try {
            const { data } = await ManagerApi.users();
            setUsers(data.users || []);
        }
        catch (e) { }
    }
    async function refresh() {
        setError(null);
        try {
            const { data } = await ManagerApi.all({ from, to, employeeId, status });
            setRecords(data.records || []);
        }
        catch (e) {
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
    return (_jsxs("div", { className: "stack", children: [_jsx("h2", { className: "section-title", children: "All Employees Attendance" }), _jsxs("div", { className: "card row", style: { alignItems: 'center' }, children: [_jsx("input", { className: "input", placeholder: "From YYYY-MM-DD", value: from, onChange: (e) => setFrom(e.target.value) }), _jsx("input", { className: "input", placeholder: "To YYYY-MM-DD", value: to, onChange: (e) => setTo(e.target.value) }), _jsxs("select", { className: "select", value: employeeId, onChange: (e) => setEmployeeId(e.target.value), children: [_jsx("option", { value: "", children: "All Employees" }), users.map((u) => (_jsxs("option", { value: u.employeeId, children: [u.name, " (", u.employeeId, ")"] }, u.id)))] }), _jsxs("select", { className: "select", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "", children: "Any status" }), _jsx("option", { value: "present", children: "Present" }), _jsx("option", { value: "late", children: "Late" }), _jsx("option", { value: "half-day", children: "Half-day" })] }), _jsx("button", { className: "btn btn-primary", onClick: refresh, children: "Apply Filters" }), _jsx("button", { className: "btn", onClick: exportCSV, children: "Export CSV" })] }), error && _jsx("div", { className: "label", style: { color: 'var(--danger)' }, children: error }), _jsx("div", { className: "card", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Employee" }), _jsx("th", { children: "Date" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Check In" }), _jsx("th", { children: "Check Out" }), _jsx("th", { children: "Hours" })] }) }), _jsx("tbody", { children: records.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: userMap[r.userId]?.name ? `${userMap[r.userId].name} (${userMap[r.userId].employeeId})` : r.userId }), _jsx("td", { children: r.date }), _jsx("td", { children: _jsx("span", { className: `badge ${r.status}`, children: r.status }) }), _jsx("td", { children: r.checkInTime || '-' }), _jsx("td", { children: r.checkOutTime || '-' }), _jsx("td", { children: r.totalHours ?? '-' })] }, r.id))) })] }) })] }));
}
