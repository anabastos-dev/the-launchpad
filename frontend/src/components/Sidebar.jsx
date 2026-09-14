import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../api.js'

const STATUS_DOT = { 'atrasada': '#E24B4A', 'bloqueada': '#E24B4A', 'em risco': '#EF9F27' }
function dotColor(status) { return STATUS_DOT[(status || '').toLowerCase()] || '#22C55E' }

const NAV = [
  { to: '/', label: 'Mission Control', exact: true, icon: (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.9"/>
      <rect x="8" y="1" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.5"/>
      <rect x="1" y="8" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.5"/>
      <rect x="8" y="8" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.25"/>
    </svg>
  )},
  { to: '/alerts', label: 'Risk Signals', icon: (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5L12.5 12H1.5L7 1.5Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
      <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="7" cy="10.5" r="0.75" fill="currentColor"/>
    </svg>
  )},
  { to: '/agent', label: 'Task Agent', icon: (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <circle cx="11" cy="3" r="1.5" fill="#E8472A"/>
    </svg>
  )},
  { to: '/calendar', label: 'Launch Timeline', icon: (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <line x1="4" y1="1" x2="4" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="1" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
    </svg>
  )},
]

export default function Sidebar({ onLogout, userName = 'Ana Bastos' }) {
  const loc = useLocation()
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    api.getCampaigns()
      .then(data => {
        const sorted = [...data].sort((a, b) => (Number(a.due_date) || Infinity) - (Number(b.due_date) || Infinity))
        setCampaigns(sorted)
      })
      .catch(() => {})
  }, [])

  return (
    <aside style={{
      width: 280, minHeight: '100vh', height: '100vh',
      background: '#0F0F11',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'sticky', top: 0, overflowY: 'auto',
      borderRight: '1px solid rgba(255,255,255,0.07)',
    }}>

      {/* Logo */}
      <div style={{ padding: '22px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L11 6.5L17 9L11 11.5L9 17L7 11.5L1 9L7 6.5L9 1Z" fill="#E8472A"/>
            <circle cx="9" cy="9" r="2.2" fill="#0F0F11"/>
          </svg>
          <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>The Launchpad</span>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ padding: '4px 10px 0' }}>
        {NAV.map(item => {
          const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to)
          return (
            <Link key={item.to} to={item.to} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              color: active ? '#FFFFFF' : '#71717A',
              background: active ? 'rgba(232,71,42,0.14)' : 'transparent',
              fontSize: 13.5, fontWeight: active ? 600 : 400,
              textDecoration: 'none',
              borderLeft: active ? '2px solid #E8472A' : '2px solid transparent',
              transition: 'color 0.12s, background 0.12s',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#A1A1AA'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#71717A'; e.currentTarget.style.background = 'transparent' } }}
            >
              <span style={{ color: active ? '#E8472A' : 'currentColor', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Active Missions */}
      <div style={{ padding: '20px 10px 0', flex: 1 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: '#3F3F46',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '0 12px', marginBottom: 8,
        }}>Active Missions</p>
        {campaigns.map(c => {
          const active = loc.pathname === `/campaigns/${c.id}`
          return (
            <Link key={c.id} to={`/campaigns/${c.id}`} state={{ name: c.name }}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 12px', borderRadius: 8, marginBottom: 2,
                color: active ? '#E4E4E7' : '#71717A',
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                fontSize: 13, fontWeight: active ? 500 : 400,
                textDecoration: 'none',
                borderLeft: active ? '2px solid #52525B' : '2px solid transparent',
                transition: 'color 0.12s, background 0.12s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#A1A1AA'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#71717A'; e.currentTarget.style.background = 'transparent' } }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor(c.status), flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            </Link>
          )
        })}
      </div>

      {/* User */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 11,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#E8472A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0,
        }}>
          {userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#D4D4D8', fontSize: 12.5, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
          <p style={{ color: '#52525B', fontSize: 10.5, margin: 0, letterSpacing: '0.03em' }}>Flight Commander</p>
        </div>
        <button onClick={onLogout} title="Sign out" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#3F3F46', fontSize: 16, padding: 2, lineHeight: 1,
          transition: 'color 0.12s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#71717A'}
          onMouseLeave={e => e.currentTarget.style.color = '#3F3F46'}
        >⇥</button>
      </div>
    </aside>
  )
}
