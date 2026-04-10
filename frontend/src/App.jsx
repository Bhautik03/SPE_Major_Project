import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <Activity color="var(--primary)" />
          HealthCare 
        </Link>
        <div>
          {token ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                {user?.email}
              </span>
              <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Login</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={token ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>
    </>
  );
}

export default App;
