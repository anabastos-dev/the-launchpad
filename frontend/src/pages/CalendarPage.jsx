import { useState, useEffect } from 'react'
import { api } from '../api.js'

const COPA_DAYS = new Set([5, 11, 15, 19])
const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const EVENT_TYPES = ['Campanha', 'Oferta', 'Relançamento', 'Urgência', 'CRM', 'Live', 'Influencer', 'Sazonalidade', 'Outro']

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

const PALETTE = [
  '#E8472A', '#EF9F27', '#22C55E', '#185FA5', '#7C3AED',
  '#EC4899', '#0EA5E9', '#14B8A6', '#F97316', '#6366F1',
  '#84CC16', '#8B5CF6', '#18181B', '#64748B',
]

const EVENTS_KEY = 'launchpad_calendar_events'

function loadEventsLocal() {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') } catch { return [] }
}
function cacheLocal(evs) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(evs))
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function msToDateStr(ms) {
  if (!ms) return ''
  const d = new Date(Number(ms))
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function dateStrToMs(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

function monthOffset(year, month) {
  const dow = new Date(year, month - 1, 1).getDay()
  return dow === 0 ? 6 : dow - 1
}

function getEventsForDay(events, year, month, day) {
  const dayStart = new Date(year, month - 1, day, 0,  0,  0).getTime()
  const dayEnd   = new Date(year, month - 1, day, 23, 59, 59).getTime()
  return events.filter(ev => {
    const s = ev.start_date ? Number(ev.start_date) : null
    const e = ev.due_date   ? Number(ev.due_date)   : s
    if (!s) return false
    return s <= dayEnd && (e ?? s) >= dayStart
  })
}

function MonthGrid({ year, month, label, events, onEventClick, onDayClick }) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const offset = monthOffset(year, month)
  const today  = new Date()

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
          const dayEvs  = getEventsForDay(events, year, month, day)
          const copa    = month === 7 && COPA_DAYS.has(day)
          const todayDay = isToday(day)
          const weekend = (i % 7 === 5) || (i % 7 === 6)
          return (
            <div
              key={day}
              onClick={() => onDayClick(year, month, day)}
              style={{
                minHeight: 72, borderRadius: 8,
                border: todayDay ? '1.5px solid #E8472A' : '1px solid rgba(255,255,255,0.07)',
                background: todayDay ? 'rgba(232,71,42,0.1)' : weekend ? '#141416' : '#18181B',
                padding: '6px 7px', position: 'relative', overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: todayDay ? 800 : 500, color: todayDay ? '#E8472A' : weekend ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)', lineHeight: 1 }}>
                  {day}
                </span>
                {copa && <span style={{ fontSize: 10, lineHeight: 1 }}>⚽</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dayEvs.map(ev => {
                  const color = ev.color || TYPE_COLORS[ev.type] || '#71717A'
                  return (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onEventClick(ev) }}
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

function EventModal({ event, missions, onClose, onSave, onDelete }) {
  const isEdit = !!event?.id
  const [name,      setName]      = useState(event?.name || '')
  const [type,      setType]      = useState(event?.type || 'Post')
  const [startStr,  setStartStr]  = useState(event?.start_date ? msToDateStr(event.start_date) : (event?._prefillDate || ''))
  const [dueStr,    setDueStr]    = useState(event?.due_date   ? msToDateStr(event.due_date)   : (event?._prefillDate || ''))
  const [color,     setColor]     = useState(event?.color || '')
  const [missionId, setMissionId] = useState(event?.missionId || '')
  const [premissa,  setPremissa]  = useState(event?.premissa || '')
  const [listLink,  setListLink]  = useState(event?.listLink || '')
  const [status,    setStatus]    = useState(event?.status || '')
  const [error,     setError]     = useState(null)

  function handleSave() {
    if (!name.trim()) { setError('Nome obrigatório'); return }
    onSave({
      id:        event?.id || uid(),
      name:      name.trim(),
      type,
      status:    status || null,
      start_date: dateStrToMs(startStr),
      due_date:   dateStrToMs(dueStr) || dateStrToMs(startStr),
      color:     color || null,
      missionId: missionId || null,
      premissa:  premissa.trim() || null,
      listLink:  listLink.trim() || null,
    })
  }

  const inputStyle = { border: '1px solid #E4E4E7', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#18181B', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 10, fontWeight: 700, color: '#71717A', letterSpacing: '0.06em', textTransform: 'uppercase' }
  const activeColor = color || TYPE_COLORS[type] || '#71717A'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              {isEdit ? 'Editar evento' : 'Novo evento'}
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#18181B', margin: 0, letterSpacing: '-0.02em' }}>
              {isEdit ? (name || 'Evento') : 'Calendário editorial'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Nome *</span>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Post lançamento camiseta"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={inputStyle} autoFocus
            />
          </label>

          {/* Status */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Status</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Não iniciado', 'Em planejamento', 'Em execução', 'Finalizado', 'Cancelado'].map(s => (
                <button
                  key={s} onClick={() => setStatus(status === s ? '' : s)}
                  style={{
                    padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: status === s
                      ? s === 'Em execução' ? '#0EA5E9'
                        : s === 'Em planejamento' ? '#FBBF24'
                        : s === 'Finalizado' ? '#22C55E'
                        : s === 'Cancelado' ? '#EF4444'
                        : '#A1A1AA'
                      : '#F4F4F5',
                    color: status === s ? '#fff' : '#52525B',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </label>

          {/* Type */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Tipo</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EVENT_TYPES.map(t => (
                <button
                  key={t} onClick={() => setType(t)}
                  style={{
                    padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: type === t ? (TYPE_COLORS[t] || '#18181B') : '#F4F4F5',
                    color: type === t ? '#fff' : '#52525B',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </label>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={labelStyle}>Início</span>
              <input type="date" value={startStr} onChange={e => setStartStr(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={labelStyle}>Fim</span>
              <input type="date" value={dueStr} onChange={e => setDueStr(e.target.value)} style={inputStyle} />
            </label>
          </div>

          {/* Premissa */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Premissa</span>
            <textarea
              value={premissa}
              onChange={e => setPremissa(e.target.value)}
              placeholder="Descreva o objetivo e contexto desta ação…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </label>

          {/* Link da lista */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Link da lista (ClickUp)</span>
            <input
              value={listLink}
              onChange={e => setListLink(e.target.value)}
              placeholder="https://app.clickup.com/..."
              style={inputStyle}
            />
          </label>

          {/* Mission link */}
          {missions.length > 0 && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={labelStyle}>Vincular à missão (opcional)</span>
              <select
                value={missionId}
                onChange={e => setMissionId(e.target.value)}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                <option value=''>Sem vínculo</option>
                {missions.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
          )}

          {/* Color picker */}
          <div>
            <p style={{ ...labelStyle, margin: '0 0 8px' }}>Cor (opcional)</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {PALETTE.map(c => (
                <button
                  key={c} onClick={() => setColor(color === c ? '' : c)}
                  style={{
                    width: 24, height: 24, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {error && <p style={{ fontSize: 11, color: '#E24B4A', margin: '12px 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          {isEdit && (
            <button
              onClick={() => onDelete(event.id)}
              style={{ padding: '9px 14px', border: '1px solid #FECACA', background: '#FFF', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#E24B4A', cursor: 'pointer' }}
            >
              Excluir
            </button>
          )}
          <button onClick={onClose} style={{ flex: 1, border: '1px solid #E4E4E7', background: '#fff', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, color: '#71717A', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{ flex: 2, border: 'none', background: activeColor, borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
          >
            {isEdit ? 'Salvar' : '+ Criar evento'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [events,   setEvents]   = useState(loadEventsLocal)
  const [missions, setMissions] = useState([])
  const [modal,    setModal]    = useState(null) // { event } or { _prefillDate }

  useEffect(() => {
    api.getCampaigns().then(setMissions).catch(() => {})
    api.getEvents().then(evs => {
      if (evs.length > 0) {
        setEvents(evs); cacheLocal(evs)
      } else {
        // Backend vazio — sobe o que está no localStorage (migração inicial)
        const local = loadEventsLocal()
        if (local.length > 0) api.saveEvents(local).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  function handleDayClick(year, month, day) {
    const str = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    setModal({ _prefillDate: str })
  }

  function handleSave(ev) {
    setEvents(prev => {
      const exists = prev.find(e => e.id === ev.id)
      const next = exists ? prev.map(e => e.id === ev.id ? ev : e) : [...prev, ev]
      cacheLocal(next)
      api.saveEvents(next).catch(() => {})
      return next
    })
    setModal(null)
  }

  function handleDelete(id) {
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id)
      cacheLocal(next)
      api.saveEvents(next).catch(() => {})
      return next
    })
    setModal(null)
  }

  const today = new Date()
  const year  = today.getFullYear()

  return (
    <div style={{ padding: '40px 44px 64px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Mission Control</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#F4F4F5', margin: '0 0 6px', lineHeight: 1 }}>Calendário Editorial</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {events.length} evento{events.length !== 1 ? 's' : ''} · clique em um dia para adicionar
          </p>
        </div>
        <button
          onClick={() => setModal({})}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E8472A', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
        >
          + Novo evento
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <MonthGrid year={year} month={7}  label="Julho 2026"  events={events} onEventClick={ev => setModal({ ...ev })} onDayClick={handleDayClick} />
        <MonthGrid year={year} month={8}  label="Agosto 2026" events={events} onEventClick={ev => setModal({ ...ev })} onDayClick={handleDayClick} />

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {EVENT_TYPES.map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: TYPE_COLORS[t], borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{t}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10 }}>⚽</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Copa do Brasil</span>
          </div>
        </div>
      </div>

      {modal !== null && (
        <EventModal
          event={modal}
          missions={missions}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
