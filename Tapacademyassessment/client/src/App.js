import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import AllEmployeesPage from './pages/AllEmployeesPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import TeamCalendarPage from './pages/TeamCalendarPage';
import ReportsPage from './pages/ReportsPage';
function Nav() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    return (_jsx("header", { className: "nav", children: _jsxs("div", { className: "nav-inner container", children: [_jsx("span", { className: "brand", children: "Tap Attendance" }), _jsx(Link, { to: "/", children: "Dashboard" }), _jsx(Link, { to: "/history", children: "My History" }), user?.role === 'manager' && (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/manager", children: "Manager" }), _jsx(Link, { to: "/manager/all", children: "All Employees" }), _jsx(Link, { to: "/manager/calendar", children: "Team Calendar" }), _jsx(Link, { to: "/manager/reports", children: "Reports" })] })), _jsx("span", { className: "grow" }), user ? (_jsxs("div", { className: "row", style: { alignItems: 'center' }, children: [_jsx("span", { className: "muted", children: user.name }), _jsx("span", { className: `badge ${user.role}`, children: user.role }), _jsx("button", { className: "btn btn-danger", onClick: () => { logout(); navigate('/login'); }, children: "Logout" })] })) : (_jsxs("div", { className: "row", children: [_jsx(Link, { to: "/login", children: "Login" }), _jsx(Link, { to: "/register", children: "Register" })] }))] }) }));
}
export default function App() {
    const { user } = useAuthStore();
    return (_jsxs("div", { children: [_jsx(Nav, {}), _jsx("div", { className: "container", style: { paddingTop: 20 }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/", element: user ? _jsx(DashboardPage, {}) : _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/history", element: user ? _jsx(HistoryPage, {}) : _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/manager", element: user?.role === 'manager' ? _jsx(ManagerDashboardPage, {}) : _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/manager/all", element: user?.role === 'manager' ? _jsx(AllEmployeesPage, {}) : _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/manager/calendar", element: user?.role === 'manager' ? _jsx(TeamCalendarPage, {}) : _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/manager/reports", element: user?.role === 'manager' ? _jsx(ReportsPage, {}) : _jsx(Navigate, { to: "/login", replace: true }) })] }) })] }));
}
