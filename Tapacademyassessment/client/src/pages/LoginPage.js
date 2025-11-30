import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AuthApi } from '../services/api';
import { useAuthStore } from '../store/auth';
export default function LoginPage() {
    const [email, setEmail] = useState('enter email');
    const [password, setPassword] = useState('enter password');
    const [error, setError] = useState(null);
    const setAuth = useAuthStore((s) => s.setAuth);
    async function submit(e) {
        e.preventDefault();
        setError(null);
        try {
            const { data } = await AuthApi.login(email, password);
            setAuth(data.user, data.token);
            window.location.href = '/';
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Login failed');
        }
    }
    return (_jsx("div", { className: "container", style: { maxWidth: 520 }, children: _jsxs("div", { className: "card stack", children: [_jsx("h2", { className: "section-title", children: "Welcome back" }), _jsxs("form", { className: "stack", onSubmit: submit, children: [_jsxs("div", { className: "field", children: [_jsx("label", { className: "label", children: "Email" }), _jsx("input", { className: "input", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "email@example.com" })] }), _jsxs("div", { className: "field", children: [_jsx("label", { className: "label", children: "Password" }), _jsx("input", { className: "input", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), error && _jsx("div", { className: "label", style: { color: 'var(--danger)' }, children: error }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "btn btn-primary", type: "submit", children: "Login" }), _jsx("a", { href: "/register", className: "btn btn-secondary", style: { textDecoration: 'none' }, children: "Create account" })] })] }), _jsx("p", { className: "muted", children: "Sample: manager@example.com, emp1@example.com \u2026 emp5@example.com (password123)" })] }) }));
}
