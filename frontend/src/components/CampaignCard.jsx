import { Link } from 'react-router-dom'

const RISK = {
  HIGH:    { dot: '#E24B4A', label: 'Crítico',   bg: '#FEF2F2', labelColor: '#991B1B' },
  MEDIUM:  { dot: '#EF9F27', label: 'Em risco',  bg: '#FAEEDA', labelColor: '#854F0B' },
  WARNING: { dot: '#EF9F27', label: 'Atenção',   bg: '#FAEEDA', labelColor: '#854F0B' },
  OK:      { dot: '#639922', label: 'No prazo',  bg: '#EAF3DE', labelColor: '#3B6D11' },
  ERROR:   { dot: '#888780', label: 'Erro',      bg: '#F1EFE8', labelColor: '#5F5E5A' },
}

export default function CampaignCard({ campaign }) {
  const r = RISK[campaign.risco] || RISK.OK
  const highCount = (campaign.alertas || []).filter(a => a.severidade === 'HIGH').length
  const total = (campaign.alertas || []).length

  return (
    <Link to={`/campaigns/${campaign.id}`} style={{
      display: 'block', background: '#FFFFFF', border: '1px solid #E4E4E7',
      borderRadius: 14, padding: '18px 20px', textDecoration: 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#D3D1C7'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E4E7'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#18181B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {campaign.name}
          </p>
        </div>
        {total > 0 && (
          <span style={{
            background: r.bg, color: r.labelColor, fontSize: 11, fontWeight: 700,
            padding: '3px 9px', borderRadius: 99, flexShrink: 0,
          }}>
            {total} alerta{total > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {campaign.risco !== 'OK' && total > 0 && (
        <p style={{ fontSize: 12, color: '#888780', margin: '8px 0 0 16px' }}>
          {highCount > 0 ? `${highCount} crítico${highCount > 1 ? 's' : ''} · ` : ''}{r.label}
        </p>
      )}
    </Link>
  )
}
