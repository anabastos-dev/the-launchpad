import { useState, useEffect } from 'react'
import { api } from '../api.js'

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const TYPE_COLORS = {
  Campanha:      '#E8472A',
  Oferta:        '#EF9F27',
  Relançamento:  '#185FA5',
  Urgência:      '#E24B4A',
  CRM:           '#7C3AED',
  Live:          '#22C55E',
  Influencer:    '#EC4899',
  Sazonalidade:  '#14B8A6',
  Outro:         '#71717A',
}

const EVENTS_KEY = 'launchpad_calendar_events'

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') } catch { return [] }
}

function monthOffset(year, month) {
  const dow = new Date(year, month - 1, 1).getDay()
  return dow === 0 ? 6 : dow - 1
}

function getEventsForDay(events, year, month, day) {
  const dayStart = new Date(year, month - 1, day,  0,  0,  0).getTime()
  const dayEnd   = new Date(year, month - 1, day, 23, 59, 59).getTime()
  return events.filter(ev => {
    const s = ev.start_date ? Number(ev.start_date) : null
    const e = ev.due_date   ? Number(ev.due_date)   : s
    if (!s) return false
    return s <= dayEnd && (e ?? s) >= dayStart
  })
}

// ─── Event detail modal (read-only) ──────────────────────────────────────────
const TEAM_ID = '31012836'
function listUrl(id) { return `https://app.clickup.com/${TEAM_ID}/v/li/${id}` }

function EventDetail({ event, onClose }) {
  const color = event.color || TYPE_COLORS[event.type] || '#71717A'
  const fmt = (ms) => ms ? new Date(Number(ms)).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : null
  const start = fmt(event.start_date)
  const end   = fmt(event.due_date)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 420, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        {/* Header fixo */}
        <div style={{ padding: '24px 28px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                {event.type && <p style={{ fontSize: 9, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{event.type}</p>}
                {event.status && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 99,
                    background: event.status === 'Em execução' ? 'rgba(14,165,233,0.12)' : event.status === 'Em planejamento' ? 'rgba(251,191,36,0.12)' : event.status === 'Finalizado' ? 'rgba(34,197,94,0.12)' : event.status === 'Cancelado' ? 'rgba(239,68,68,0.12)' : 'rgba(161,161,170,0.12)',
                    color: event.status === 'Em execução' ? '#0284C7' : event.status === 'Em planejamento' ? '#B45309' : event.status === 'Finalizado' ? '#16A34A' : event.status === 'Cancelado' ? '#DC2626' : '#71717A',
                  }}>
                    {event.status}
                  </span>
                )}
              </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18181B', margin: 0, letterSpacing: '-0.02em' }}>{event.name}</h3>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 22, lineHeight: 1, padding: 2, flexShrink: 0 }}>×</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {(start || end) && (
              <span style={{ fontSize: 11, color: '#71717A' }}>
                {start && end && start !== end ? `${start} → ${end}` : start || end}
              </span>
            )}
            {(event.listLink || event.missionId) && (
              <a href={event.listLink || listUrl(event.missionId)} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', textDecoration: 'none' }}>
                Ver lista no ClickUp ↗
              </a>
            )}
          </div>
        </div>
        {/* Corpo com scroll */}
        <div style={{ padding: '0 28px 24px', overflowY: 'auto', borderTop: '1px solid #F0F0F0' }}>
          {event.premissa ? (
            <div style={{ paddingTop: 16 }}>
              <p style={{ fontSize: 9.5, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 10px' }}>Premissa</p>
              <p style={{ fontSize: 13, color: '#3F3F46', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>{event.premissa}</p>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#A1A1AA', fontStyle: 'italic', margin: '16px 0 0' }}>Sem premissa cadastrada.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Month grid (read-only) — mesma estética do CalendarPage ─────────────────
function MonthGrid({ year, month, label, events, onEventClick }) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const offset      = monthOffset(year, month)
  const today       = new Date()

  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d) =>
    year === today.getFullYear() && month === today.getMonth() + 1 && d === today.getDate()

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>{label}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4, gap: 3 }}>
        {DAYS_OF_WEEK.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dayEvs   = getEventsForDay(events, year, month, day)
          const todayDay = isToday(day)
          const weekend  = (i % 7 === 5) || (i % 7 === 6)
          return (
            <div
              key={day}
              style={{
                minHeight: 72, borderRadius: 8,
                border: todayDay ? '1.5px solid #E8472A' : '1px solid rgba(255,255,255,0.07)',
                background: todayDay ? 'rgba(232,71,42,0.1)' : weekend ? '#141416' : '#18181B',
                padding: '6px 7px', position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: todayDay ? 800 : 500, color: todayDay ? '#E8472A' : weekend ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)', lineHeight: 1 }}>
                  {day}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dayEvs.map(ev => {
                  const color = ev.color || TYPE_COLORS[ev.type] || '#71717A'
                  return (
                    <div
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      style={{ background: color, borderRadius: 3, padding: '2px 5px', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%', letterSpacing: '0.02em' }}>
                        {ev.type && <span style={{ opacity: 0.8 }}>{ev.type} · </span>}{ev.name}
                      </span>
                    </div>
                  )
                })}
              </div>
              {todayDay && (
                <div style={{ position: 'absolute', bottom: 4, right: 5, fontSize: 7.5, fontWeight: 800, color: '#E8472A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>hoje</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MktPage() {
  const [events,   setEvents]   = useState(loadEvents)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.getEvents().then(setEvents).catch(() => setEvents(loadEvents()))
  }, [])

  const today = new Date()
  const year  = today.getFullYear()

  // Months from current through December
  const currentMonth = today.getMonth() + 1
  const monthLabels  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const months = []
  for (let m = currentMonth; m <= 12; m++) months.push(m)

  return (
    <div style={{ background: '#0F0F11', minHeight: '100vh' }}>
    <div style={{ padding: '40px 44px 64px', maxWidth: 1100 }}>

      {/* Header — idêntico ao CalendarPage */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Mission Control</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#F4F4F5', margin: '0 0 6px', lineHeight: 1 }}>Calendário Editorial</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {events.length} evento{events.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Month grids */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {months.map(m => (
          <MonthGrid
            key={m}
            year={year}
            month={m}
            label={`${monthLabels[m - 1]} ${year}`}
            events={events}
            onEventClick={setSelected}
          />
        ))}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
    </div>
  )
}
