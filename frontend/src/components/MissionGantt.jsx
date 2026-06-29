import { Link } from 'react-router-dom'
import { CAMPAIGNS } from '../mock.js'

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000)
}

const TODAY       = parseDate('2026-06-29')
const RANGE_START = parseDate('2026-06-25')
const RANGE_END   = parseDate('2026-07-31')
const TOTAL_DAYS  = daysBetween(RANGE_START, RANGE_END) + 1

function toPct(date) {
  return (daysBetween(RANGE_START, date) / TOTAL_DAYS) * 100
}

const TICKS = []
for (let d = 1; d <= 31; d += 5) TICKS.push({ date: parseDate(`2026-07-${String(d).padStart(2,'0')}`), label: `${d}/07` })

const COPA = [5, 11, 15, 19].map(d => parseDate(`2026-07-${String(d).padStart(2,'0')}`))

const RISK_COLOR = {
  HIGH:    '#E24B4A',
  MEDIUM:  '#EF9F27',
  WARNING: '#EF9F27',
  OK:      '#22C55E',
}

export default function MissionGantt({ compact = false }) {
  const todayPct = toPct(TODAY)
  const rowH     = compact ? 44 : 52

  return (
    <div>
      {/* Ruler */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', marginBottom: 4 }}>
        <div />
        <div style={{ position: 'relative', height: compact ? 20 : 24 }}>
          {TICKS.map(({ date, label }) => (
            <span key={label} style={{
              position: 'absolute',
              left: `${toPct(date)}%`,
              fontSize: 9, color: '#A1A1AA', fontWeight: 600,
              transform: 'translateX(-50%)',
              letterSpacing: '0.04em',
            }}>
              {label}
            </span>
          ))}
          {COPA.map(d => (
            <span key={d.getDate()} style={{
              position: 'absolute',
              left: `${toPct(d)}%`,
              fontSize: 9,
              transform: 'translateX(-50%)',
              top: 11,
              lineHeight: 1,
              userSelect: 'none',
            }}>⚽</span>
          ))}
          <span style={{
            position: 'absolute',
            left: `${todayPct}%`,
            fontSize: 9, color: '#E8472A', fontWeight: 700,
            transform: 'translateX(-50%)',
            top: 0,
          }}>hoje</span>
        </div>
      </div>

      {/* Rows */}
      <div style={{ border: '1px solid #E4E4E7', borderRadius: 12, overflow: 'hidden', background: '#FFFFFF' }}>
        {CAMPAIGNS.map((c, idx) => {
          const start    = parseDate(c.lancamento)
          const end      = parseDate(c.encerramento || c.lancamento)
          const leftPct  = Math.max(0, toPct(start))
          const rightPct = Math.min(100, toPct(end) + (1 / TOTAL_DAYS) * 100)
          const widthPct = Math.max(0.8, rightPct - leftPct)
          const color    = RISK_COLOR[c.risco] || RISK_COLOR.OK
          const fmtDate  = (d) => `${d.getDate()}/${d.getMonth() === 5 ? '06' : '07'}`

          return (
            <div key={c.id} style={{
              display: 'grid', gridTemplateColumns: '130px 1fr',
              borderBottom: idx < CAMPAIGNS.length - 1 ? '1px solid #F4F4F5' : 'none',
              minHeight: rowH,
            }}>
              <Link to={`/campaigns/${c.id}`} style={{
                padding: '10px 12px 10px 14px', borderRight: '1px solid #F4F4F5',
                textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <p style={{ fontSize: 10.5, fontWeight: 600, color: '#18181B', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                </div>
                {!compact && <p style={{ fontSize: 9.5, color: '#A1A1AA', margin: '2px 0 0 10px' }}>{c.fase}</p>}
              </Link>

              <div style={{ position: 'relative', padding: '10px 8px', display: 'flex', alignItems: 'center' }}>
                {COPA.map(d => (
                  <div key={d.getDate()} style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `calc(${toPct(d)}% + 8px)`,
                    width: 1, background: 'rgba(34,139,34,0.15)', zIndex: 1,
                    pointerEvents: 'none',
                  }} />
                ))}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `calc(${todayPct}% + 8px)`,
                  width: 1, background: 'rgba(232,71,42,0.4)', zIndex: 2,
                  pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative', width: '100%', height: 20 }}>
                  <div style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    height: '100%',
                    background: color,
                    borderRadius: 5,
                    opacity: 0.85,
                    display: 'flex', alignItems: 'center', paddingLeft: 7,
                    overflow: 'hidden',
                    minWidth: 4,
                  }}>
                    {widthPct > 6 && (
                      <span style={{ fontSize: 8.5, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
                        {fmtDate(start)}{end.getTime() !== start.getTime() ? ` → ${fmtDate(end)}` : ''}
                      </span>
                    )}
                  </div>
                  {c.alertCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      left: `calc(${leftPct + widthPct}% + 4px)`,
                      top: '50%', transform: 'translateY(-50%)',
                      fontSize: 8.5, fontWeight: 700, color,
                      background: '#FEF2F2', border: `1px solid ${color}`,
                      padding: '1px 5px', borderRadius: 99,
                    }}>
                      {c.alertCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap' }}>
        {[['#E24B4A','Crítico'],['#EF9F27','Em risco'],['#22C55E','On track'],['#E8472A','Hoje']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: label === 'Hoje' ? 1 : 9, height: label === 'Hoje' ? 12 : 9, background: color, borderRadius: label === 'Hoje' ? 0 : 2, opacity: 0.8 }} />
            <span style={{ fontSize: 9.5, color: '#A1A1AA', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9.5 }}>⚽</span>
          <span style={{ fontSize: 9.5, color: '#A1A1AA', fontWeight: 500 }}>Copa do Brasil</span>
        </div>
      </div>
    </div>
  )
}
