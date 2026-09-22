import { Link } from 'react-router-dom'
import { theme } from '../theme.js'

const STATUS_COLOR = {
  'atrasada': theme.danger,
  'bloqueada': theme.danger,
  'em risco':  theme.warning,
}
function barColor(status) {
  return STATUS_COLOR[(status || '').toLowerCase()] || theme.success
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000)
}

function fmtDay(ms) {
  const d = new Date(Number(ms))
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MissionGantt({ compact = false, campaigns = [] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  const withDates = campaigns.filter(c => c.due_date)
  if (withDates.length === 0) return null

  const allMs = withDates.flatMap(c => [Number(c.start_date || c.due_date), Number(c.due_date)])
  const rangeStart = Math.min(todayMs - 7 * 86400000, ...allMs)
  const rangeEnd   = Math.max(todayMs + 14 * 86400000, ...allMs)
  const totalDays  = daysBetween(rangeStart, rangeEnd) + 1

  function toPct(ms) {
    return (daysBetween(rangeStart, Number(ms)) / totalDays) * 100
  }

  const todayPct = toPct(todayMs)
  const rowH = compact ? 44 : 52

  // Ruler ticks every ~7 days
  const ticks = []
  for (let i = 0; i <= totalDays; i += 7) {
    const d = new Date(rangeStart + i * 86400000)
    ticks.push({ ms: d.getTime(), label: `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}` })
  }

  return (
    <div>
      {/* Ruler */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', marginBottom: 4 }}>
        <div />
        <div style={{ position: 'relative', height: 20 }}>
          {ticks.map(({ ms, label }) => (
            <span key={ms} style={{ position: 'absolute', left: `${toPct(ms)}%`, fontSize: 9, color: theme.textFaint, fontWeight: 600, transform: 'translateX(-50%)', letterSpacing: '0.04em' }}>
              {label}
            </span>
          ))}
          <span style={{ position: 'absolute', left: `${todayPct}%`, fontSize: 9, color: theme.accent, fontWeight: 700, transform: 'translateX(-50%)', top: 0 }}>
            hoje
          </span>
        </div>
      </div>

      {/* Rows */}
      <div style={{ border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: 'hidden', background: theme.bg }}>
        {withDates.map((c, idx) => {
          const startMs  = Number(c.start_date || c.due_date)
          const endMs    = Number(c.due_date)
          const leftPct  = Math.max(0, toPct(startMs))
          const rightPct = Math.min(100, toPct(endMs) + (1 / totalDays) * 100)
          const widthPct = Math.max(0.8, rightPct - leftPct)
          const color    = barColor(c.status)

          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', borderBottom: idx < withDates.length - 1 ? `1px solid ${theme.border}` : 'none', minHeight: rowH }}>
              <Link to={`/campaigns/${c.id}`} state={{ name: c.name }} style={{ padding: '10px 12px 10px 14px', borderRight: `1px solid ${theme.border}`, textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <p style={{ fontSize: 10.5, fontWeight: 600, color: theme.text, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                </div>
                {!compact && c.status && <p style={{ fontSize: 9.5, color: theme.textFaint, margin: '2px 0 0 10px' }}>{c.status}</p>}
              </Link>

              <div style={{ position: 'relative', padding: '10px 8px', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${todayPct}% + 8px)`, width: 1, background: theme.accentBorder, zIndex: 2, pointerEvents: 'none' }} />
                <div style={{ position: 'relative', width: '100%', height: 20 }}>
                  <div style={{ position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`, height: '100%', background: color, borderRadius: 5, display: 'flex', alignItems: 'center', paddingLeft: 7, overflow: 'hidden', minWidth: 4 }}>
                    {widthPct > 6 && (
                      <span style={{ fontSize: 8.5, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
                        {fmtDay(startMs)}{endMs !== startMs ? ` → ${fmtDay(endMs)}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap' }}>
        {[[theme.danger, 'Crítico'], [theme.warning, 'Em risco'], [theme.success, 'On track'], [theme.accent, 'Hoje']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: label === 'Hoje' ? 1 : 9, height: label === 'Hoje' ? 12 : 9, background: color, borderRadius: label === 'Hoje' ? 0 : 2 }} />
            <span style={{ fontSize: 9.5, color: theme.textFaint, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
