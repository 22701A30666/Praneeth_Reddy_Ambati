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
  return (
    <header className="nav">
      <div className="nav-inner container">
        <span className="brand">Tap Attendance</span>
        <Link to="/">Dashboard</Link>
        <Link to="/history">My History</Link>
        {user?.role === 'manager' && (
          <>
            <Link to="/manager">Manager</Link>
            <Link to="/manager/all">All Employees</Link>
            <Link to="/manager/calendar">Team Calendar</Link>
            <Link to="/manager/reports">Reports</Link>
          </>
        )}
        <span className="grow" />
        {user ? (
          <div className="row" style={{ alignItems: 'center' }}>
            <span className="muted">{user.name}</span>
            <span className={`badge ${user.role}`}>{user.role}</span>
            <button className="btn btn-danger" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
          </div>
        ) : (
          <div className="row">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default function App() {
  const { user } = useAuthStore();
  return (
    <div>
      <Nav />
      <div className="container" style={{ paddingTop: 20 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" replace />} />
          <Route path="/history" element={user ? <HistoryPage /> : <Navigate to="/login" replace />} />
          <Route path="/manager" element={user?.role === 'manager' ? <ManagerDashboardPage /> : <Navigate to="/login" replace />} />
          <Route path="/manager/all" element={user?.role === 'manager' ? <AllEmployeesPage /> : <Navigate to="/login" replace />} />
          <Route path="/manager/calendar" element={user?.role === 'manager' ? <TeamCalendarPage /> : <Navigate to="/login" replace />} />
          <Route path="/manager/reports" element={user?.role === 'manager' ? <ReportsPage /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}
