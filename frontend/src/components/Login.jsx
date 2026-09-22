import { useState } from 'react'
import { api } from '../api.js'
import { theme } from '../theme.js'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [code, setCode]         = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, name } = await api.login(email.trim().toLowerCase(), code)
      onLogin(token, name)
    } catch {
      setError('Código de acesso inválido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: theme.bg }}>
      {/* Left panel */}
      <div style={{ width: '42%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 52px', background: theme.bgSubtle, borderRight: `1px solid ${theme.border}`, position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(55,53,47,0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(232,71,42,0.1)" strokeWidth="1" />
        </svg>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L13.5 8.5L20 11L13.5 13.5L11 20L8.5 13.5L2 11L8.5 8.5L11 2Z" fill={theme.accent} />
            </svg>
            <span style={{ color: theme.text, fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>The Launchpad</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: theme.text, margin: '0 0 16px', lineHeight: 1.15 }}>
            Campaign ops,<br />
            <span style={{ color: theme.accent }}>mission-ready.</span>
          </h1>
          <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.7, margin: 0, maxWidth: 280 }}>
            where campaigns are tracked,<br />risks are flagged, and execution happens
          </p>
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { label: 'Active missions', value: '4' },
            { label: 'Risk signals', value: '5' },
            { label: 'Tasks tracked', value: '72' },
            { label: 'Next launch', value: 'T-18' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ color: theme.accent, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 2px', fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
              <p style={{ color: theme.textFaint, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: theme.text, margin: '0 0 6px' }}>Access mission control</h2>
            <p style={{ color: theme.textMuted, fontSize: 13, margin: 0 }}>Internal use only — Minimal Club</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Seu email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="pedro.nasser@minimalclub.com.br"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 13, color: theme.text, background: theme.bgSubtle, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Código de acesso</label>
              <input
                type="password"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, fontSize: 13, color: theme.text, background: theme.bgSubtle, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {error && (
              <div style={{ background: theme.dangerBg, border: '1px solid rgba(224,62,62,0.25)', borderRadius: theme.radiusSm, padding: '9px 12px', marginBottom: 14 }}>
                <p style={{ color: theme.danger, fontSize: 12, margin: 0 }}>{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: theme.radiusSm, background: loading ? theme.textFaint : theme.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', letterSpacing: '0.01em' }}
            >
              {loading ? 'Autenticando...' : 'Launch →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
