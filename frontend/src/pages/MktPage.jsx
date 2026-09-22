import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { Legend, MonthGrid, SubscribeModal, EventDetail, DetailPanelStyles } from '../components/calendarShared.jsx'
import { theme } from '../theme.js'

const EVENTS_KEY = 'launchpad_calendar_events'

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') } catch { return [] }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MktPage() {
  const [events,   setEvents]   = useState(loadEvents)
  const [selected, setSelected] = useState(null)
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    api.getEvents().then(setEvents).catch(() => setEvents(loadEvents()))
  }, [])

  useEffect(() => {
    const el = document.getElementById('calendar-today-cell')
    if (el) el.scrollIntoView({ block: 'center' })
  }, [])

  const today = new Date()
  const year  = today.getFullYear()

  // Months from current through December — or from Janeiro when showing past campaigns
  const currentMonth = today.getMonth() + 1
  const monthLabels  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const months = []
  for (let m = showPast ? 1 : currentMonth; m <= 12; m++) months.push(m)

  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
    <div style={{ padding: '40px 44px 64px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, color: theme.textFaint, margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Mission Control</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: theme.text, margin: '0 0 6px', lineHeight: 1 }}>Calendário Editorial</h1>
          <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>
            {events.length} evento{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowPast(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: '7px 14px', fontSize: 11, fontWeight: 700, color: theme.textMuted, cursor: 'pointer' }}
          >{showPast ? '✕ Ocultar campanhas passadas' : '📁 Campanhas passadas'}</button>
          <button
            onClick={() => setSubscribeOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: '7px 14px', fontSize: 11, fontWeight: 700, color: theme.textMuted, cursor: 'pointer' }}
          >🔔 Receber mudanças e alertas</button>
        </div>
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

    <DetailPanelStyles />
    </div>
  )
}
