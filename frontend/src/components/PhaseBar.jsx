const PHASES = [
  { key: 'estrategia', label: 'Estratégia' },
  { key: 'kickoff',    label: 'Kickoff' },
  { key: 'producao',   label: 'Produção' },
  { key: 'pre',        label: 'Pré-lançamento' },
  { key: 'live',       label: 'Live' },
  { key: 'retro',      label: 'Retro' },
]

const PHASE_COLORS = {
  done:    { bg: '#E8472A', text: '#fff' },
  active:  { bg: '#18181B', text: '#fff' },
  pending: { bg: '#F1EFE8', text: '#B4B2A9' },
}

export default function PhaseBar({ fases }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {PHASES.map(p => {
        const state = fases[p.key] || 'pending'
        const c = PHASE_COLORS[state]
        return (
          <div key={p.key} style={{ flex: 1, background: c.bg, borderRadius: 6, padding: '5px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: c.text, margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>
              {p.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
