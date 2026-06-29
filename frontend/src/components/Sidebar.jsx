import { Link, useLocation } from 'react-router-dom'
import { CAMPAIGNS } from '../mock.js'

const RISK_DOT = { HIGH: '#E24B4A', MEDIUM: '#EF9F27', WARNING: '#EF9F27', OK: '#639922' }

const NAV = [
  { to: '/', label: 'Mission Control', icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.8"/>
      <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.5"/>
      <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.5"/>
      <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.3"/>
    </svg>
  ), exact: true },
  { to: '/alerts', label: 'Risk Signals', icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <line x1="7" y1="5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="7" cy="10.5" r="0.7" fill="currentColor"/>
    </svg>
  )},
  { to: '/calendar', label: 'Launch Timeline', icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <line x1="4" y1="1" x2="4" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="1" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    </svg>
  )},
]

export default function Sidebar({ onLogout, userName = 'Ana Bastos', alertCount = 0 }) {
  const loc = useLocation()

  return (
    <aside style={{ width: 240, minHeight: '100vh', height: '100vh', background: '#0F0F11', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L11 6.5L17 9L11 11.5L9 17L7 11.5L1 9L7 6.5L9 1Z" fill="#E8472A"/>
            <circle cx="9" cy="9" r="2" fill="#0F0F11"/>
          </svg>
          <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}>The Launchpad</span>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ padding: '8px 8px 0' }}>
        {NAV.map(item => {
          const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 10px', borderRadius: 7, marginBottom: 1,
                color: active ? '#FFFFFF' : '#52525B',
                background: active ? 'rgba(232,71,42,0.12)' : 'transparent',
                fontSize: 12.5, fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                borderLeft: active ? '2px solid #E8472A' : '2px solid transparent',
                transition: 'all 0.1s',
              }}
            >
              <span style={{ color: active ? '#E8472A' : 'currentColor', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.to === '/alerts' && alertCount > 0 && (
                <span style={{ background: '#E8472A', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, letterSpacing: '0.02em' }}>{alertCount}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{ margin: '14px 18px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

      {/* Campaigns */}
      <div style={{ padding: '0 8px', flex: 1 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: '#27272A', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 6 }}>Active Missions</p>
        {CAMPAIGNS.map(c => {
          const active = loc.pathname === `/campaigns/${c.id}`
          return (
            <Link
              key={c.id}
              to={`/campaigns/${c.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 7, marginBottom: 1,
                color: active ? '#FAFAFA' : '#3F3F46',
                background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                fontSize: 12, textDecoration: 'none',
                borderLeft: active ? '2px solid #52525B' : '2px solid transparent',
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: RISK_DOT[c.risco] || '#639922', flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              {c.alertCount > 0 && <span style={{ color: '#3F3F46', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>{c.alertCount}</span>}
            </Link>
          )
        })}
      </div>

      {/* User */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8472A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
          {userName.slice(0,2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#A1A1AA', fontSize: 11.5, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
          <p style={{ color: '#27272A', fontSize: 10, margin: 0, letterSpacing: '0.04em' }}>Flight Commander</p>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#27272A', fontSize: 14, padding: 2, lineHeight: 1 }} title="Sign out">⇥</button>
      </div>
    </aside>
  )
}
