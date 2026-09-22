// Shared calendar-grid rendering used by both CalendarPage (authenticated,
// editable) and MktPage (public, read-only) — kept in one place so visual
// fixes and the notification opt-in don't drift between the two.
import { useState } from 'react'
import { api } from '../api.js'
import { theme } from '../theme.js'

export const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export const EVENT_TYPES = ['Campanha', 'Oferta', 'Relançamento', 'Urgência', 'CRM', 'Live', 'Influencer', 'Sazonalidade', 'Outro']

export const TYPE_COLORS = {
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

export function monthOffset(year, month) {
  const dow = new Date(year, month - 1, 1).getDay()
  return dow === 0 ? 6 : dow - 1
}

export function getEventsForDay(events, year, month, day) {
  const dayStart = new Date(year, month - 1, day, 0,  0,  0).getTime()
  const dayEnd   = new Date(year, month - 1, day, 23, 59, 59).getTime()
  return events.filter(ev => {
    const s = ev.start_date ? Number(ev.start_date) : null
    const e = ev.due_date   ? Number(ev.due_date)   : s
    if (!s) return false
    return s <= dayEnd && (e ?? s) >= dayStart
  })
}

export function Legend() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', margin: '0 0 24px', padding: '10px 14px', background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: theme.radius }}>
      {EVENT_TYPES.map(t => (
        <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: theme.textMuted, fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[t], display: 'inline-block' }} />
          {t}
        </span>
      ))}
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: theme.textFaint, fontWeight: 600, marginLeft: 'auto' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.borderStrong, display: 'inline-block' }} />
        Cancelado
      </span>
    </div>
  )
}

// onDayClick omitted (undefined) → read-only grid (used by MktPage)
export function MonthGrid({ year, month, label, events, onEventClick, onDayClick }) {
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
      <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>{label}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4, gap: 3 }}>
        {DAYS_OF_WEEK.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.06em', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dayEvs  = getEventsForDay(events, year, month, day)
          const todayDay = isToday(day)
          const weekend = (i % 7 === 5) || (i % 7 === 6)
          return (
            <div
              key={day}
              id={todayDay ? 'calendar-today-cell' : undefined}
              onClick={onDayClick ? () => onDayClick(year, month, day) : undefined}
              style={{
                minHeight: 84, borderRadius: theme.radiusSm,
                border: todayDay ? `1.5px solid ${theme.accent}` : `1px solid ${theme.border}`,
                background: todayDay ? theme.accentBg : weekend ? theme.bgSubtle : theme.bg,
                padding: '6px 7px', position: 'relative', overflow: 'hidden',
                cursor: onDayClick ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: todayDay ? 800 : 500, color: todayDay ? theme.accent : weekend ? theme.textFaint : theme.textMuted, lineHeight: 1 }}>
                  {day}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {dayEvs.map(ev => {
                  const color     = TYPE_COLORS[ev.type] || theme.textMuted
                  const cancelled = ev.status === 'Cancelado'
                  const dim = cancelled ? 0.4 : 1

                  return (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                      style={{ background: color, opacity: dim, borderRadius: 3, padding: '3px 6px', cursor: 'pointer', textDecoration: cancelled ? 'line-through' : 'none' }}
                    >
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%', letterSpacing: '0.02em' }}>
                        {ev.name}
                      </span>
                    </div>
                  )
                })}
              </div>
              {todayDay && (
                <div style={{ position: 'absolute', bottom: 4, right: 5, fontSize: 7.5, fontWeight: 800, color: theme.accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>hoje</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SubscribeModal({ onClose }) {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [errMsg, setErrMsg] = useState('')

  async function handleSubscribe() {
    if (!email.trim()) return
    setStatus('loading')
    try {
      const r = await api.subscribeToCalendar(email.trim())
      setStatus('done')
      setErrMsg(r.name ? `Pronto, ${r.name}!` : '')
    } catch (e) {
      setStatus('error')
      setErrMsg(e.message || 'Erro ao inscrever')
    }
  }

  const inputStyle = { border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: '9px 12px', fontSize: 13, color: theme.text, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,15,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: theme.bg, borderRadius: 14, padding: '28px 32px', width: 380, border: `1px solid ${theme.border}`, boxShadow: '0 20px 50px rgba(47,46,43,0.14)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Alertas do calendário</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: 0, letterSpacing: '-0.02em' }}>Receber mudanças e alertas</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textFaint, fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
        </div>

        {status === 'done' ? (
          <p style={{ fontSize: 13, color: theme.success, fontWeight: 600 }}>✓ Inscrito! {errMsg} Você vai receber no ClickUp quando uma campanha mudar de data ou for cancelada.</p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: theme.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
              Coloque seu e-mail do ClickUp. Você recebe um alerta sempre que a data de uma campanha mudar, se uma nova campanha for criada ou for cancelada.
            </p>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu.nome@minimalclub.com.br"
              onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
              style={inputStyle} autoFocus
            />
            {status === 'error' && <p style={{ fontSize: 11, color: theme.danger, margin: '8px 0 0' }}>{errMsg}</p>}
            <button
              onClick={handleSubscribe}
              disabled={status === 'loading'}
              style={{ width: '100%', marginTop: 14, border: 'none', background: theme.text, borderRadius: theme.radiusSm, padding: '10px 0', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}
            >
              {status === 'loading' ? 'Inscrevendo…' : 'Quero receber'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
