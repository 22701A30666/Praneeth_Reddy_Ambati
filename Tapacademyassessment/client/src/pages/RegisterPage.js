import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AuthApi } from '../services/api';
import { useAuthStore } from '../store/auth';
export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('employee');
    const [employeeId, setEmployeeId] = useState('');
    const [department, setDepartment] = useState('Engineering');
    const [error, setError] = useState(null);
    const setAuth = useAuthStore((s) => s.setAuth);
    async function submit(e) {
        e.preventDefault();
        setError(null);
        try {
            const { data } = await AuthApi.register({ name, email, password, role, employeeId, department });
            setAuth(data.user, data.token);
            window.location.href = '/';
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Registration failed');
        }
    }
    return (_jsx("div", { className: "container", style: { maxWidth: 640 }, children: _jsxs("div", { className: "card stack", children: [_jsx("h2", { className: "section-title", children: "Create your account" }), _jsxs("form", { className: "grid grid-2", onSubmit: submit, children: [_jsxs("div", { className: "field", children: [_jsx("label", { className: "label", children: "Name" }), _jsx("input", { className: "input", value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { className: "label", children: "Email" }), _jsx("input", { className: "input", value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { className: "label", children: "Password" }), _jsx("input", { className: "input", type: "password", value: password, onChange: (e) => setPassword(e.target.value) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { className: "label", children: "Role" }), _jsxs("select", { className: "select", value: role, onChange: (e) => setRole(e.target.value), children: [_jsx("option", { value: "employee", children: "Employee" }), _jsx("option", { value: "manager", children: "Manager" })] })] }), _jsxs("div", { className: "field", children: [_jsx("label", { className: "label", children: "Employee ID" }), _jsx("input", { className: "input", value: employeeId, onChange: (e) => setEmployeeId(e.target.value), placeholder: "e.g. EMP010" })] }), _jsxs("div", { className: "field", children: [_jsx("label", { className: "label", children: "Department" }), _jsx("input", { className: "input", value: department, onChange: (e) => setDepartment(e.target.value) })] }), error && _jsx("div", { className: "label", style: { color: 'var(--danger)' }, children: error }), _jsxs("div", { className: "row", style: { gridColumn: '1 / -1' }, children: [_jsx("button", { className: "btn btn-primary", type: "submit", children: "Create Account" }), _jsx("a", { href: "/login", className: "btn", style: { textDecoration: 'none' }, children: "Have an account? Login" })] })] })] }) }));
}
