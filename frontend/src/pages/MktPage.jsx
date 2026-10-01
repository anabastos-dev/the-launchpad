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
  const todayMs = today.getTime()

  // Months from current through December — or from Janeiro when showing past campaigns
  const currentMonth = today.getMonth() + 1
  const monthLabels  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const months = []
  for (let m = showPast ? 1 : currentMonth; m <= 12; m++) months.push(m)

  // A glanceable stat, same spirit as a countdown — "how far to the next thing"
  const upcoming = events
    .filter(e => e.status !== 'Cancelado' && e.start_date && Number(e.start_date) >= todayMs)
    .sort((a, b) => Number(a.start_date) - Number(b.start_date))[0]
  const daysToNext = upcoming ? Math.round((Number(upcoming.start_date) - todayMs) / 86400000) : null
  const activeNow = events.filter(e => e.status !== 'Cancelado' && e.start_date && e.due_date
    && Number(e.start_date) <= todayMs && Number(e.due_date) >= todayMs).length

  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
    <div className="mkt-page" style={{ maxWidth: 1180 }}>

      {/* Header — a hero stat alongside the title, not just a label row */}
      <div className="mkt-hero" style={{ marginBottom: 36, paddingBottom: 32, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, color: theme.textFaint, margin: '0 0 10px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Minimal Club</p>
          <h1 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.03em', color: theme.text, margin: '0 0 8px', lineHeight: 1.05 }}>Calendário Editorial</h1>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: '0 0 22px', maxWidth: 440, lineHeight: 1.5 }}>
            Todas as campanhas de marketing da Minimal Club, com datas e premissa — atualizado pelo time em tempo real.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowPast(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: '8px 14px', fontSize: 11.5, fontWeight: 600, color: theme.textMuted, cursor: 'pointer' }}
            >{showPast ? '✕ Ocultar campanhas passadas' : '📁 Campanhas passadas'}</button>
            <button
              onClick={() => setSubscribeOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: theme.text, border: 'none', borderRadius: theme.radiusSm, padding: '8px 14px', fontSize: 11.5, fontWeight: 600, color: theme.bg, cursor: 'pointer' }}
            >🔔 Receber mudanças e alertas</button>
          </div>
        </div>

        <div className="mkt-hero-divider" style={{ background: theme.border }} />

        <div className="mkt-hero-stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 2 }}>
          <div>
            <p style={{ fontSize: 9.5, color: theme.textFaint, margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              {upcoming ? (daysToNext === 0 ? 'estreia hoje' : daysToNext === 1 ? 'próxima campanha — amanhã' : `próxima campanha em`) : 'sem campanha futura'}
            </p>
            {upcoming ? (
              <>
                {daysToNext > 1 && (
                  <p style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.03em', color: theme.text, margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{daysToNext}<span style={{ fontSize: 13, fontWeight: 600, color: theme.textFaint, marginLeft: 6 }}>dias</span></p>
                )}
                <p style={{ fontSize: 13, color: theme.text, fontWeight: 600, margin: '8px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{upcoming.name}</p>
              </>
            ) : (
              <p style={{ fontSize: 13, color: theme.textFaint, margin: 0 }}>nada agendado ainda</p>
            )}
          </div>
          <p style={{ fontSize: 11, color: theme.textFaint, margin: 0, paddingTop: 16 }}>
            <strong style={{ color: theme.textMuted }}>{activeNow}</strong> no ar agora · <strong style={{ color: theme.textMuted }}>{events.length}</strong> no total
          </p>
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
    <style>{`
      .mkt-page { padding: 48px 44px 64px; }
      .mkt-hero { display: flex; align-items: stretch; gap: 40px; }
      .mkt-hero-divider { width: 1px; flex-shrink: 0; }
      .mkt-hero-stat { width: 230px; flex-shrink: 0; }
      @media (max-width: 680px) {
        .mkt-page { padding: 32px 20px 48px; }
        .mkt-hero { flex-direction: column; gap: 20px; }
        .mkt-hero-divider { display: none; }
        .mkt-hero-stat { width: 100%; }
      }
    `}</style>
    </div>
  )
}
