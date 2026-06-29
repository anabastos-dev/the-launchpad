const S = {
  ATRASADA:       { color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
  BLOQUEADA:      { color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' },
  EM_RISCO:       { color: '#854F0B', bg: '#FEF3C7', border: '#FDE68A' },
  OK:             { color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97' },
  CONCLUIDA:      { color: '#5F5E5A', bg: '#F1EFE8', border: '#D3D1C7' },
  SEM_PRAZO:      { color: '#5F5E5A', bg: '#F1EFE8', border: '#D3D1C7' },
  RACI_INCOMPLETO:{ color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' },
}
const LABELS = { ATRASADA: 'Atrasada', BLOQUEADA: 'Bloqueada', EM_RISCO: 'Em risco', OK: 'No prazo', CONCLUIDA: 'Concluída', SEM_PRAZO: 'Sem prazo', RACI_INCOMPLETO: 'Sem RACI' }

export default function StatusBadge({ status, size = 'sm' }) {
  const s = S[status] || S.OK
  const p = size === 'sm' ? '2px 8px' : '4px 12px'
  const fs = size === 'sm' ? 11 : 12
  return (
    <span style={{ fontSize: fs, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: p, borderRadius: 99, flexShrink: 0, letterSpacing: '0.01em' }}>
      {LABELS[status] || status}
    </span>
  )
}
