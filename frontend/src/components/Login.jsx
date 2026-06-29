import { useState } from 'react'

export default function Login({ onLogin }) {
  const [user, setUser] = useState('ana')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      if (password.length === 0) {
        setError('Por favor, insira uma senha.')
        setLoading(false)
        return
      }
      onLogin('demo_token_' + user)
      setLoading(false)
    }, 500)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0A0A0C' }}>
      {/* Left panel — branding */}
      <div style={{ width: '42%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 52px', borderRight: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
        {/* Grid overlay */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Accent line */}
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(232,71,42,0.07)" strokeWidth="1" />
        </svg>

        {/* Logo */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L13.5 8.5L20 11L13.5 13.5L11 20L8.5 13.5L2 11L8.5 8.5L11 2Z" fill="#E8472A" />
              <circle cx="11" cy="11" r="2.5" fill="#0A0A0C" />
            </svg>
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>The Launchpad</span>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', color: '#FFFFFF', margin: '0 0 16px', lineHeight: 1.1 }}>
            Campaign ops,<br />
            <span style={{ color: '#E8472A' }}>mission-ready.</span>
          </h1>
          <p style={{ color: '#52525B', fontSize: 13, lineHeight: 1.7, margin: 0, maxWidth: 280 }}>
            where campaigns are tracked,<br />risks are flagged, and execution happens
          </p>
        </div>

        {/* Bottom stats */}
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { label: 'Active missions', value: '4' },
            { label: 'Risk signals', value: '5' },
            { label: 'Tasks tracked', value: '72' },
            { label: 'Next launch', value: 'T-18' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ color: '#E8472A', fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 2px', fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
              <p style={{ color: '#3F3F46', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF', margin: '0 0 6px' }}>Access mission control</h2>
            <p style={{ color: '#52525B', fontSize: 13, margin: 0 }}>Internal use only — Minimal Club</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#3F3F46', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Operador</label>
              <select value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: '#FAFAFA', background: 'rgba(255,255,255,0.04)', outline: 'none', boxSizing: 'border-box' }}>
                <option style={{ background: '#18181B' }} value="ana">Ana Bastos</option>
                <option style={{ background: '#18181B' }} value="joao">João</option>
              </select>
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#3F3F46', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Código de acesso</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: '#FAFAFA', background: 'rgba(255,255,255,0.04)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {error && (
              <div style={{ background: 'rgba(153,27,27,0.15)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '9px 12px', marginBottom: 14 }}>
                <p style={{ color: '#FCA5A5', fontSize: 12, margin: 0 }}>{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: 8, background: loading ? '#27272A' : '#E8472A', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', letterSpacing: '0.01em', transition: 'background 0.15s' }}
            >
              {loading ? 'Autenticando...' : 'Launch →'}
            </button>
          </form>
          <p style={{ fontSize: 11, color: '#27272A', textAlign: 'center', margin: '20px 0 0' }}>Demo: qualquer senha funciona</p>
        </div>
      </div>
    </div>
  )
}
