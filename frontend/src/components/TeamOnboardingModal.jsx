import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { theme } from '../theme.js'

// First-login setup for a líder: which teams they answer for, and who their
// liderados are — this drives the daily digest and the Risk Signals "meu
// time" filter, so it has to be filled in before either of those work.
export default function TeamOnboardingModal({ onDone }) {
  const [teamsStr, setTeamsStr] = useState('')
  const [members, setMembers] = useState([])
  const [liderados, setLiderados] = useState(new Set())
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getTeamMembers().then(setMembers).catch(() => setMembers([]))
  }, [])

  function toggle(name) {
    const next = new Set(liderados)
    if (next.has(name)) next.delete(name); else next.add(name)
    setLiderados(next)
  }

  async function handleSubmit() {
    const teams = teamsStr.split(',').map(s => s.trim()).filter(Boolean)
    if (teams.length === 0) { setError('Diz pelo menos um time'); return }
    if (liderados.size === 0) { setError('Seleciona ao menos um liderado'); return }
    setSaving(true)
    try {
      await api.saveTeamMe({ teams, liderados: [...liderados] })
      onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = members.filter(m => m.name && m.name.toLowerCase().includes(search.toLowerCase()))
  const inputStyle = { border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: '9px 12px', fontSize: 13, color: theme.text, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,15,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: theme.bg, borderRadius: 14, padding: '28px 32px', width: 420, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Bem-vindo(a)</p>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Configurar seu time</h2>
        <p style={{ fontSize: 12, color: theme.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
          Isso define o que você vê nos alertas diários e no filtro "meu time" do Risk Signals. Pode editar depois.
        </p>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quais times você é responsável?</span>
            <input
              value={teamsStr} onChange={e => setTeamsStr(e.target.value)}
              placeholder="Ex: Social, CRM, Site"
              style={inputStyle}
            />
            <span style={{ fontSize: 10.5, color: theme.textFaint }}>Separe por vírgula</span>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quem são seus liderados?</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar pessoa…"
              style={inputStyle}
            />
          </label>
          <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 8, border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm }}>
            {filtered.length === 0 && (
              <p style={{ fontSize: 12, color: theme.textFaint, padding: '10px 12px' }}>Carregando pessoas…</p>
            )}
            {filtered.map(m => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: theme.text, borderBottom: `1px solid ${theme.border}` }}>
                <input type="checkbox" checked={liderados.has(m.name)} onChange={() => toggle(m.name)} style={{ width: 14, height: 14, accentColor: theme.accent }} />
                {m.name}
              </label>
            ))}
          </div>
        </div>

        {error && <p style={{ fontSize: 11, color: theme.danger, margin: '12px 0 0' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', marginTop: 16, border: 'none', background: theme.accent, borderRadius: theme.radiusSm, padding: '11px 0', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: saving ? 0.6 : 1, flexShrink: 0 }}
        >
          {saving ? 'Salvando…' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
