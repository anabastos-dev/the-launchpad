import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { TYPE_COLORS, Legend, MonthGrid, SubscribeModal } from '../components/calendarShared.jsx'

const EVENTS_KEY = 'launchpad_calendar_events'

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') } catch { return [] }
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MktPage() {
  const [events,   setEvents]   = useState(loadEvents)
  const [selected, setSelected] = useState(null)
  const [subscribeOpen, setSubscribeOpen] = useState(false)

  useEffect(() => {
    api.getEvents().then(setEvents).catch(() => setEvents(loadEvents()))
  }, [])

  useEffect(() => {
    const el = document.getElementById('calendar-today-cell')
    if (el) el.scrollIntoView({ block: 'center' })
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Mission Control</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#F4F4F5', margin: '0 0 6px', lineHeight: 1 }}>Calendário Editorial</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {events.length} evento{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setSubscribeOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 700, color: '#A1A1AA', cursor: 'pointer' }}
        >🔔 Receber mudanças e alertas</button>
      </div>

      <Legend />

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
      </div>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
      {subscribeOpen && <SubscribeModal onClose={() => setSubscribeOpen(false)} />}
    </div>
    </div>
  )
}
