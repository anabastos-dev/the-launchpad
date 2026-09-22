import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CampaignPage from './pages/CampaignPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import MktPage from './pages/MktPage.jsx'
import AgentPage from './pages/AgentPage.jsx'
import TeamAccessPage from './pages/TeamAccessPage.jsx'
import TeamOnboardingModal from './components/TeamOnboardingModal.jsx'
import TeamDigestModal from './components/TeamDigestModal.jsx'
import { TeamContext } from './teamContext.jsx'
import { api } from './api.js'
import { theme } from './theme.js'

function decodeToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return {} }
}

function AppShell({ onLogout, userName }) {
  const [teamInfo, setTeamInfo] = useState(null)

  function refetch() {
    api.getTeamMe().then(setTeamInfo).catch(() => setTeamInfo({ role: 'admin', needsOnboarding: false, digestPending: false }))
  }
  useEffect(() => { refetch() }, [])

  return (
    <TeamContext.Provider value={teamInfo || { role: 'admin', teams: [], liderados: [] }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar onLogout={onLogout} userName={userName} alertCount={0} />
        <main style={{ flex: 1, background: theme.bg, overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/team-access" element={<TeamAccessPage />} />
              <Route path="/campaigns/:id" element={<CampaignPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <footer style={{ padding: '10px 44px', borderTop: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: theme.accent, fontWeight: 700, fontSize: 10, letterSpacing: '-0.01em' }}>The Launchpad</span>
            <span style={{ color: theme.textFaint, fontSize: 10 }}>·</span>
            <span style={{ color: theme.textFaint, fontSize: 10, fontStyle: 'italic', letterSpacing: '0.01em' }}>where campaigns are tracked, risks are flagged, and execution happens</span>
          </footer>
        </main>

        {teamInfo?.needsOnboarding && <TeamOnboardingModal onDone={refetch} />}
        {!teamInfo?.needsOnboarding && teamInfo?.digestPending && (
          <TeamDigestModal onClose={() => setTeamInfo(prev => ({ ...prev, digestPending: false }))} />
        )}
      </div>
    </TeamContext.Provider>
  )
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('minimal_token'))

  function handleLogin(tk) {
    localStorage.setItem('minimal_token', tk)
    setToken(tk)
  }
  function handleLogout() {
    localStorage.removeItem('minimal_token')
    setToken(null)
  }

  const userName = token ? (decodeToken(token).name || 'Usuário') : ''

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/mkt" element={<MktPage />} />
        <Route path="/*" element={
          token
            ? <AppShell onLogout={handleLogout} userName={userName} />
            : <Login onLogin={handleLogin} />
        } />
      </Routes>
    </BrowserRouter>
  )
}
