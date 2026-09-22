import { theme } from '../theme.js'

// Gantt-style timeline for Risk Signals — Notion "Timeline view" look:
// a date-scaled header, one row per task, a colored bar spanning its dates,
// a today marker. Built for the handful of at-risk items this page shows
// (not meant for hundreds of rows).
const DAY_MS = 86400000

const SEVERITY_COLOR = {
  HIGH:        theme.danger,
  MEDIUM:      theme.warning,
  OPPORTUNITY: theme.success,
}
const SEVERITY_LABEL = {
  HIGH:        'Crítico',
  MEDIUM:      'Vence hoje',
  OPPORTUNITY: 'Oportunidade',
}

function startOfDay(ms) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export default function RiskTimeline({ items }) {
  if (items.length === 0) return null

  const now = Date.now()
  let minDate = now, maxDate = now
  for (const it of items) {
    const s = it.start_date ? Number(it.start_date) : Number(it.due_date)
    const e = it.due_date ? Number(it.due_date) : s
    if (s < minDate) minDate = s
    if (e > maxDate) maxDate = e
  }
  // pad a few days on each side so bars/markers never sit flush on the edge
  minDate = startOfDay(Math.min(minDate, now) - 2 * DAY_MS)
  maxDate = startOfDay(Math.max(maxDate, now) + 2 * DAY_MS)
  const totalDays = Math.max(1, Math.round((maxDate - minDate) / DAY_MS))

  const LABEL_W = 260
  const DAY_W = Math.max(22, Math.min(46, Math.floor(760 / totalDays)))
  const CHART_W = totalDays * DAY_W

  function xFor(ms) {
    return ((Number(ms) - minDate) / DAY_MS) * DAY_W
  }

  // week tick labels
  const ticks = []
  for (let d = 0; d <= totalDays; d += 7) {
    const date = new Date(minDate + d * DAY_MS)
    ticks.push({ x: d * DAY_W, label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) })
  }

  // weekend columns, shaded faintly — a Notion timeline touch that makes the
  // week rhythm readable at a glance instead of counting grid lines
  const weekends = []
  for (let d = 0; d <= totalDays; d++) {
    const dow = new Date(minDate + d * DAY_MS).getDay()
    if (dow === 0 || dow === 6) weekends.push(d * DAY_W)
  }

  const todayX = xFor(now)
  const rowH = 40
  const totalH = items.length * rowH

  return (
    <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: theme.radius + 4, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ position: 'relative', minWidth: LABEL_W + CHART_W }}>

          {/* Date header */}
          <div style={{ display: 'flex', height: 32, borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, background: theme.bg, zIndex: 2 }}>
            <div style={{ width: LABEL_W, flexShrink: 0, borderRight: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Tarefa
            </div>
            <div style={{ position: 'relative', width: CHART_W, flexShrink: 0 }}>
              {ticks.map((t, i) => (
                <div key={i} style={{ position: 'absolute', left: t.x, top: 0, height: '100%', display: 'flex', alignItems: 'center', paddingLeft: 6, fontSize: 10, color: theme.textFaint, fontWeight: 600, borderLeft: `1px solid ${theme.border}`, width: 7 * DAY_W }}>
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div style={{ position: 'relative' }}>
            {/* Weekend shading + week gridlines span the full row area, under the bars */}
            <div style={{ position: 'absolute', top: 0, left: LABEL_W, width: CHART_W, height: totalH, pointerEvents: 'none' }}>
              {weekends.map(x => (
                <div key={x} style={{ position: 'absolute', top: 0, bottom: 0, left: x, width: DAY_W, background: theme.bgSubtle }} />
              ))}
              {ticks.map((t, i) => (
                <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: t.x, width: 1, background: theme.border }} />
              ))}
            </div>

            {items.map((it, i) => {
              const color = SEVERITY_COLOR[it.severity]
              const s = it.start_date ? Number(it.start_date) : Number(it.due_date)
              const e = it.due_date ? Number(it.due_date) : s
              const barX = xFor(s)
              const barW = Math.max(xFor(e) - xFor(s), 8)
              return (
                <div key={it.id} style={{ display: 'flex', height: rowH, borderBottom: `1px solid ${theme.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: LABEL_W, flexShrink: 0, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 14px', minWidth: 0, background: theme.bg }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: theme.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={it.tarefa}>
                      {it.tarefa}
                    </p>
                    <p style={{ fontSize: 10.5, color: theme.textFaint, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.responsavel || 'Sem responsável'} · {it.campanha}
                    </p>
                  </div>
                  <div style={{ position: 'relative', width: CHART_W, flexShrink: 0 }}>
                    <a
                      href={it.url} target="_blank" rel="noopener noreferrer"
                      title={`${it.tarefa} — ${SEVERITY_LABEL[it.severity]}`}
                      style={{
                        position: 'absolute', top: 9, left: barX, width: barW, height: 22,
                        background: color, borderRadius: 6,
                        display: 'flex', alignItems: 'center', padding: '0 8px',
                        textDecoration: 'none', overflow: 'hidden', whiteSpace: 'nowrap',
                        transition: 'opacity 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
                      onMouseLeave={e => e.currentTarget.style.opacity = 1}
                    >
                      {barW > 60 && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff' }}>{SEVERITY_LABEL[it.severity]}</span>
                      )}
                    </a>
                  </div>
                </div>
              )
            })}

            {/* Today marker spans the full row area */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: LABEL_W + todayX, width: 2, background: theme.accent, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: -2, left: LABEL_W + todayX + 5, fontSize: 9, fontWeight: 800, color: theme.accent, letterSpacing: '0.06em', textTransform: 'uppercase', pointerEvents: 'none' }}>hoje</div>
          </div>
        </div>
      </div>
    </div>
  )
}
