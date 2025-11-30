import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AttendanceApi } from '../services/api';
export default function HistoryPage() {
    const [records, setRecords] = useState([]);
    const [month, setMonth] = useState('');
    async function refresh() {
        const { data } = await AttendanceApi.myHistory(month || undefined);
        setRecords(data.records);
    }
    useEffect(() => {
        refresh();
    }, [month]);
    return (_jsxs("div", { className: "stack", children: [_jsx("h2", { className: "section-title", children: "My Attendance History" }), _jsxs("div", { className: "card row", style: { alignItems: 'center' }, children: [_jsxs("div", { className: "field", style: { maxWidth: 200 }, children: [_jsx("label", { className: "label", children: "Month (YYYY-MM)" }), _jsx("input", { className: "input", value: month, onChange: (e) => setMonth(e.target.value), placeholder: "2025-11" })] }), _jsx("button", { className: "btn btn-primary", onClick: refresh, children: "Refresh" })] }), _jsx("div", { className: "card", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Date" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Check In" }), _jsx("th", { children: "Check Out" }), _jsx("th", { children: "Hours" })] }) }), _jsx("tbody", { children: records.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: r.date }), _jsx("td", { children: _jsx("span", { className: `badge ${r.status}`, children: r.status }) }), _jsx("td", { children: r.checkInTime || '-' }), _jsx("td", { children: r.checkOutTime || '-' }), _jsx("td", { children: r.totalHours ?? '-' })] }, r.id))) })] }) })] }));
}
