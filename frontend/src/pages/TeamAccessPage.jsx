import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { theme } from '../theme.js'

// Admin-only: everyone with a company email can already log in as líder —
// this page controls the one extra permission that matters: who can edit
// the marketing calendar.
export default function TeamAccessPage() {
  const [members, setMembers] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [busy,     setBusy]     = useState(null)

  function load() {
    api.getAccessList().then(m => { setMembers(m); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  async function toggle(m) {
    setBusy(m.email)
    try {
      await api.setAccess(m.email, !m.canEditCalendar)
      setMembers(prev => prev.map(x => x.email === m.email ? { ...x, canEditCalendar: !x.canEditCalendar } : x))
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))
  const editorsCount = members.filter(m => m.canEditCalendar).length

  return (
    <div style={{ padding: '40px 44px 64px', maxWidth: 720 }}>
      <p style={{ fontSize: 10, color: theme.textFaint, margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Mission Control</p>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: theme.text, margin: '0 0 6px', lineHeight: 1 }}>Acessos da equipe</h1>
      <p style={{ fontSize: 12, color: theme.textMuted, margin: '0 0 28px', lineHeight: 1.6 }}>
        Qualquer pessoa com e-mail @hoomy.com.br, @minimalclub.com.br ou @grupominimal.com.br já consegue logar como líder — vê o Risk Signals do próprio time e o resumo diário de tarefas atrasadas.
        {' '}{loading ? '' : `${editorsCount} de ${members.length}`} também podem <strong>editar o calendário</strong>: ative abaixo para quem precisar disso.
      </p>

      {error && <p style={{ fontSize: 12, color: theme.danger }}>{error}</p>}

      {!loading && !error && (
        <>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar pessoa…"
            style={{ border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: '9px 12px', fontSize: 13, color: theme.text, outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: 14, fontFamily: 'inherit' }}
          />
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: 'hidden' }}>
            {filtered.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < filtered.length - 1 ? `1px solid ${theme.border}` : 'none', background: theme.bg }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, margin: 0 }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: theme.textFaint, margin: 0 }}>{m.email}</p>
                </div>
                <button
                  onClick={() => toggle(m)}
                  disabled={busy === m.email}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 99, cursor: 'pointer',
                    border: `1px solid ${m.canEditCalendar ? 'rgba(47,158,68,0.3)' : theme.border}`,
                    background: m.canEditCalendar ? theme.successBg : theme.bgSubtle,
                    color: m.canEditCalendar ? theme.success : theme.textMuted,
                    opacity: busy === m.email ? 0.5 : 1, flexShrink: 0,
                  }}
                >
                  {m.canEditCalendar ? '✓ Edita o calendário' : 'Sem acesso ao calendário'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
