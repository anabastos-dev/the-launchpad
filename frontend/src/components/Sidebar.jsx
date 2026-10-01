import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../api.js'
import { theme } from '../theme.js'
import { useTeam } from '../teamContext.jsx'

const STATUS_DOT = { 'atrasada': '#E03E3E', 'bloqueada': '#E03E3E', 'em risco': '#D9730D' }
function dotColor(status) { return STATUS_DOT[(status || '').toLowerCase()] || '#2F9E44' }

const NAV = [
  { to: '/', label: 'Control', exact: true, icon: (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.9"/>
      <rect x="8" y="1" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.5"/>
      <rect x="1" y="8" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.5"/>
      <rect x="8" y="8" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.25"/>
    </svg>
  )},
  { to: '/alerts', label: 'Risks', icon: (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5L12.5 12H1.5L7 1.5Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
      <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="7" cy="10.5" r="0.75" fill="currentColor"/>
    </svg>
  )},
  { to: '/campaign-creator', label: 'Agent', icon: (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    </svg>
  )},
  { to: '/calendar', label: 'Calendar', icon: (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <line x1="4" y1="1" x2="4" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="1" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
    </svg>
  )},
]

const ADMIN_NAV = [
  { to: '/team-access', label: 'Access', icon: (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
      <circle cx="5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <path d="M1.5 12c0-2 1.5-3.5 3.5-3.5S8.5 10 8.5 12" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M9.5 5.5L11 7l2.5-2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
]

export default function Sidebar({ onLogout, userName = 'Ana Bastos' }) {
  const loc = useLocation()
  const { role } = useTeam()
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    api.getCampaigns()
      .then(data => {
        const sorted = [...data]
          .filter(c => !c.finalized)
          .sort((a, b) => (Number(a.due_date) || Infinity) - (Number(b.due_date) || Infinity))
        setCampaigns(sorted)
      })
      .catch(() => {})
  }, [])

  return (
    <aside style={{
      width: 300, minHeight: '100vh', height: '100vh',
      background: theme.bgSubtle,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'sticky', top: 0, overflowY: 'auto',
      borderRight: `1px solid ${theme.border}`,
    }}>

      {/* Logo */}
      <div style={{ padding: '24px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L11 6.5L17 9L11 11.5L9 17L7 11.5L1 9L7 6.5L9 1Z" fill={theme.accent}/>
          </svg>
          <span style={{ color: theme.text, fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>The Launchpad</span>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ padding: '4px 12px 0' }}>
        {[...NAV, ...(role === 'admin' ? ADMIN_NAV : [])].map(item => {
          const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to)
          return (
            <Link key={item.to} to={item.to} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 12px', borderRadius: theme.radiusSm, marginBottom: 2,
              color: active ? theme.text : theme.textMuted,
              background: active ? theme.bgActive : 'transparent',
              fontSize: 14.5, fontWeight: active ? 600 : 400,
              textDecoration: 'none',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.bgHover }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ color: active ? theme.accent : theme.textFaint, flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Active Missions */}
      <div style={{ padding: '22px 12px 0', flex: 1 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: theme.textFaint,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '0 12px', marginBottom: 8,
        }}>Active Missions</p>
        {campaigns.map(c => {
          const active = loc.pathname === `/campaigns/${c.id}`
          return (
            <Link key={c.id} to={`/campaigns/${c.id}`} state={{ name: c.name }}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 12px', borderRadius: theme.radiusSm, marginBottom: 1,
                color: active ? theme.text : theme.textMuted,
                background: active ? theme.bgActive : 'transparent',
                fontSize: 13.5, fontWeight: active ? 500 : 400,
                textDecoration: 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.bgHover }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor(c.status), flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            </Link>
          )
        })}
      </div>

      {/* User */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 11,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: theme.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0,
        }}>
          {userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: theme.text, fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
          <p style={{ color: theme.textFaint, fontSize: 11, margin: 0, letterSpacing: '0.02em' }}>Flight Commander</p>
        </div>
        <button onClick={onLogout} title="Sign out" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: theme.textFaint, fontSize: 16, padding: 2, lineHeight: 1,
        }}
          onMouseEnter={e => e.currentTarget.style.color = theme.textMuted}
          onMouseLeave={e => e.currentTarget.style.color = theme.textFaint}
        >⇥</button>
      </div>
    </aside>
  )
}
