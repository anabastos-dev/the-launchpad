import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { theme } from '../theme.js'

// Once-a-day popup: overdue tasks + progress for the líder and their liderados.
export default function TeamDigestModal({ onClose }) {
  const [people, setPeople] = useState(null)
  const [error, setError]   = useState(null)

  useEffect(() => {
    api.getTeamDigest().then(d => setPeople(d.people || [])).catch(e => setError(e.message))
  }, [])

  async function handleClose() {
    api.markDigestSeen().catch(() => {})
    onClose()
  }

  const totalOverdue = (people || []).reduce((n, p) => n + p.overdue.length, 0)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,15,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && handleClose()}>
      <div style={{ background: theme.bg, borderRadius: 14, padding: '28px 32px', width: 460, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Resumo diário</p>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {people === null ? 'Carregando…' : totalOverdue > 0 ? `${totalOverdue} tarefa${totalOverdue !== 1 ? 's' : ''} atrasada${totalOverdue !== 1 ? 's' : ''}` : 'Tudo no prazo'}
        </h2>

        {error && <p style={{ fontSize: 12, color: theme.danger }}>{error}</p>}

        <div style={{ overflowY: 'auto', flex: 1, marginTop: 14 }}>
          {(people || []).map(p => (
            <div key={p.name} style={{ padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: theme.text, margin: 0 }}>{p.name}</p>
                <span style={{ fontSize: 11, color: theme.textFaint }}>
                  {p.pct !== null ? `${p.pct}% concluído · ${p.total} tarefas` : 'sem tarefas'}
                </span>
              </div>
              {p.overdue.length === 0 && p.dueToday.length === 0 ? (
                <p style={{ fontSize: 11.5, color: theme.success, margin: 0 }}>✓ Nada atrasado</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {p.overdue.map(t => (
                    <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: theme.danger, textDecoration: 'none' }}>
                      🔴 {t.tarefa} <span style={{ color: theme.textFaint }}>· {t.campanha}</span>
                    </a>
                  ))}
                  {p.dueToday.map(t => (
                    <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: theme.warning, textDecoration: 'none' }}>
                      🟡 {t.tarefa} <span style={{ color: theme.textFaint }}>· {t.campanha} · vence hoje</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleClose}
          style={{ width: '100%', marginTop: 16, border: 'none', background: theme.text, borderRadius: theme.radiusSm, padding: '10px 0', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0 }}
        >
          Ok
        </button>
      </div>
    </div>
  )
}
