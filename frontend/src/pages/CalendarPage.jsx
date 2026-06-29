import { useState } from 'react'
import { CAMPAIGNS } from '../mock.js'
import MissionGantt from '../components/MissionGantt.jsx'

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const TODAY = parseDate('2026-06-29')

const RISK_COLOR = {
  HIGH:   '#E24B4A',
  MEDIUM: '#EF9F27',
  OK:     '#22C55E',
}

// Copa do Brasil game days in July
const COPA_DAYS = new Set([5, 11, 15, 19])

// July 1 2026 = Wednesday → offset 2 in Mon-first grid (Mon=0)
const JULY_OFFSET = 2

function getCampaignsForDay(month, day) {
  const date = month === 6
    ? parseDate(`2026-06-${String(day).padStart(2,'0')}`)
    : parseDate(`2026-07-${String(day).padStart(2,'0')}`)
  return CAMPAIGNS.filter(c => {
    const start = parseDate(c.lancamento)
    const end   = parseDate(c.encerramento || c.lancamento)
    return date >= start && date <= end
  })
}

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function MonthGrid({ month, year, daysInMonth, offset, label }) {
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d) => month === 6 && d === 29

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#18181B', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 12px' }}>{label}</p>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4, gap: 3 }}>
        {DAYS_OF_WEEK.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.06em', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />

          const campaigns = getCampaignsForDay(month, day)
          const copa      = month === 7 && COPA_DAYS.has(day)
          const today     = isToday(day)
          const weekend   = (i % 7 === 5) || (i % 7 === 6)

          return (
            <div key={day} style={{
              minHeight: 72,
              borderRadius: 8,
              border: today ? '1.5px solid #E8472A' : '1px solid #E4E4E7',
              background: today ? '#FFF5F3' : weekend ? '#FAFAFA' : '#FFFFFF',
              padding: '6px 7px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Day number */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{
                  fontSize: 11, fontWeight: today ? 800 : 500,
                  color: today ? '#E8472A' : weekend ? '#A1A1AA' : '#52525B',
                  lineHeight: 1,
                }}>
                  {day}
                </span>
                {copa && <span style={{ fontSize: 10, lineHeight: 1 }}>⚽</span>}
              </div>

              {/* Campaign pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {campaigns.map(c => (
                  <div key={c.id} style={{
                    background: RISK_COLOR[c.risco] || RISK_COLOR.OK,
                    borderRadius: 3,
                    padding: '2px 5px',
                    opacity: 0.82,
                  }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%', letterSpacing: '0.02em' }}>
                      {c.name.split(' —')[0]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Today label */}
              {today && (
                <div style={{ position: 'absolute', bottom: 4, right: 5, fontSize: 7.5, fontWeight: 800, color: '#E8472A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>hoje</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [view, setView] = useState('calendar')

  return (
    <div style={{ padding: '40px 44px 64px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, color: '#A1A1AA', margin: '0 0 6px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Mission Control</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#18181B', margin: '0 0 6px', lineHeight: 1 }}>Launch Timeline</h1>
          <p style={{ fontSize: 12, color: '#A1A1AA', margin: 0 }}>Jun–Jul 2026 · {CAMPAIGNS.length} missions</p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid #E4E4E7', borderRadius: 8, overflow: 'hidden' }}>
          {[['gantt', 'Timeline'], ['calendar', 'Calendário']].map(([key, label]) => (
            <button key={key} onClick={() => setView(key)} style={{
              padding: '7px 16px', fontSize: 11, fontWeight: 600,
              background: view === key ? '#18181B' : 'transparent',
              color: view === key ? '#FFFFFF' : '#71717A',
              border: 'none', cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'gantt' ? (
        <MissionGantt />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {/* June — only last week (29 = hoje) */}
          <MonthGrid
            month={6} year={2026}
            daysInMonth={30}
            offset={0}   /* June 1 = Monday */
            label="Junho 2026"
          />
          <MonthGrid
            month={7} year={2026}
            daysInMonth={31}
            offset={JULY_OFFSET}
            label="Julho 2026"
          />

          {/* Legend */}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {[['#E24B4A','Crítico'],['#EF9F27','Em risco'],['#22C55E','On track']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, background: color, borderRadius: 2, opacity: 0.82 }} />
                <span style={{ fontSize: 10, color: '#A1A1AA', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10 }}>⚽</span>
              <span style={{ fontSize: 10, color: '#A1A1AA', fontWeight: 500 }}>Copa do Brasil</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: '#FFF5F3', border: '1.5px solid #E8472A', borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: '#A1A1AA', fontWeight: 500 }}>Hoje</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
