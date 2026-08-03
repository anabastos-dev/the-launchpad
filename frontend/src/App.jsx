import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CampaignPage from './pages/CampaignPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import MktPage from './pages/MktPage.jsx'
function AppShell({ onLogout }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onLogout={onLogout} userName="Ana Bastos" alertCount={0} />
      <main style={{ flex: 1, background: '#0F0F11', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/campaigns/:id" element={<CampaignPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <footer style={{ padding: '10px 44px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#E8472A', fontWeight: 700, fontSize: 10, letterSpacing: '-0.01em' }}>The Launchpad</span>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontStyle: 'italic', letterSpacing: '0.01em' }}>where campaigns are tracked, risks are flagged, and execution happens</span>
        </footer>
      </main>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('minimal_token'))
  function handleLogin(tk) { localStorage.setItem('minimal_token', tk); setToken(tk) }
  function handleLogout() { localStorage.removeItem('minimal_token'); setToken(null) }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/mkt" element={<MktPage />} />
        <Route path="/*" element={
          token
            ? <AppShell onLogout={handleLogout} />
            : <Login onLogin={handleLogin} />
        } />
      </Routes>
    </BrowserRouter>
  )
}
