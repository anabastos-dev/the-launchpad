import Avatar from './Avatar.jsx'

const SEV = {
  HIGH:    { accent: '#E24B4A', bg: '#FEF2F2', border: '#FECACA', label: 'CRÍTICO' },
  MEDIUM:  { accent: '#BA7517', bg: '#FFFBEB', border: '#FDE68A', label: 'RISCO' },
  WARNING: { accent: '#854F0B', bg: '#FEF3C7', border: '#FDE68A', label: 'ATENÇÃO' },
  INFO:    { accent: '#185FA5', bg: '#EFF6FF', border: '#BFDBFE', label: 'INFO' },
  LOW:     { accent: '#5F5E5A', bg: '#F9FAFB', border: '#E5E7EB', label: 'BAIXO' },
}

const TIPO_LABEL = {
  ATRASADA:         'Atrasada',
  BLOQUEADA:        'Bloqueada',
  EM_RISCO:         'Em risco',
  CASCATA:          'Cascata',
  HANDOFF_PENDENTE: 'Handoff pendente',
  RACI_INCOMPLETO:  'RACI incompleto',
}

const STATUS_COLOR = {
  ATRASADA: '#E24B4A',
  BLOQUEADA: '#BA7517',
  EM_RISCO:  '#854F0B',
  CONCLUIDA: '#15803D',
}

export default function AlertCard({ alerta, showCampanha = false }) {
  const s = SEV[alerta.severidade] || SEV.LOW
  const cascata = alerta.cascata || []

  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 18px', borderLeft: `3px solid ${s.accent}` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: cascata.length ? 12 : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: s.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {s.label}
            </span>
            <span style={{ fontSize: 9, color: '#D4D4D0' }}>·</span>
            <span style={{ fontSize: 9, color: '#888780', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {TIPO_LABEL[alerta.tipo] || alerta.tipo}
            </span>
            {showCampanha && alerta.campanha && (
              <>
                <span style={{ fontSize: 9, color: '#D4D4D0' }}>·</span>
                <span style={{ fontSize: 9, color: '#A1A1AA' }}>{alerta.campanha}</span>
              </>
            )}
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#18181B', margin: 0, lineHeight: 1.4 }}>
            {alerta.tarefa}
          </p>
          {alerta.diasAtraso > 0 && (
            <p style={{ fontSize: 11, color: s.accent, margin: '3px 0 0', fontWeight: 500 }}>
              {alerta.diasAtraso} dia{alerta.diasAtraso > 1 ? 's' : ''} de atraso
            </p>
          )}
        </div>
        {alerta.responsavel && <Avatar person={alerta.responsavel} size={26} />}
      </div>

      {/* Cascade chain */}
      {cascata.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, background: 'rgba(255,255,255,0.55)', borderRadius: 8, padding: '8px 10px' }}>
          {cascata.map((step, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 500,
                color: STATUS_COLOR[step.status] || '#444441',
                background: 'rgba(255,255,255,0.85)',
                border: `1px solid ${i === 0 ? s.border : '#E4E4E7'}`,
                borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap',
              }}>
                {step.name}
              </span>
              {i < cascata.length - 1 && (
                <span style={{ fontSize: 11, color: '#C4C2BA', fontWeight: 700 }}>→</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
