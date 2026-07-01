import { useState, useEffect } from 'react'
import { api } from '../api.js'
import MissionGantt from '../components/MissionGantt.jsx'

const COPA_DAYS = new Set([5, 11, 15, 19])
const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const STATUS_RISK = {
  'em produção':     'MEDIUM',
  'em planejamento': 'OK',
  'kickoff':         'OK',
  'pré-lançamento':  'MEDIUM',
  'live':            'OK',
  'concluída':       'OK',
  'atrasada':        'HIGH',
  'bloqueada':       'HIGH',
}
const RISK_COLOR = { HIGH: '#E24B4A', MEDIUM: '#EF9F27', OK: '#22C55E' }

function msToDateStr(ms) {
  if (!ms) return ''
  const d = new Date(Number(ms))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dateStrToMs(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

function monthOffset(year, month) {
  // Day of week for 1st of month, Monday=0
  const dow = new Date(year, month - 1, 1).getDay()
  return dow === 0 ? 6 : dow - 1
}

function getCampaignsForDay(campaigns, year, month, day) {
  const ts = new Date(year, month - 1, day).getTime()
  return campaigns.filter(c => {
    const s = c.start_date ? Number(c.start_date) : null
    const e = c.due_date   ? Number(c.due_date)   : s
    if (!s) return false
    const dayStart = new Date(year, month - 1, day, 0,  0,  0).getTime()
    const dayEnd   = new Date(year, month - 1, day, 23, 59, 59).getTime()
    return s <= dayEnd && e >= dayStart
  })
}

function MonthGrid({ year, month, label, campaigns, onCampaignClick }) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const offset = monthOffset(year, month)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`

  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d) => year === today.getFullYear() && month === today.getMonth() + 1 && d === today.getDate()

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#18181B', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 12px' }}>{label}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4, gap: 3 }}>
        {DAYS_OF_WEEK.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.06em', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dayCampaigns = getCampaignsForDay(campaigns, year, month, day)
          const copa    = month === 7 && COPA_DAYS.has(day)
          const today   = isToday(day)
          const weekend = (i % 7 === 5) || (i % 7 === 6)
          return (
            <div key={day} style={{
              minHeight: 72, borderRadius: 8,
              border: today ? '1.5px solid #E8472A' : '1px solid #E4E4E7',
              background: today ? '#FFF5F3' : weekend ? '#FAFAFA' : '#FFFFFF',
              padding: '6px 7px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: today ? 800 : 500, color: today ? '#E8472A' : weekend ? '#A1A1AA' : '#52525B', lineHeight: 1 }}>
                  {day}
                </span>
                {copa && <span style={{ fontSize: 10, lineHeight: 1 }}>⚽</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dayCampaigns.map(c => {
                  const risk = STATUS_RISK[(c.status || '').toLowerCase()] || 'OK'
                  const color = RISK_COLOR[risk]
                  return (
                    <div key={c.id} onClick={() => onCampaignClick(c)} style={{
                      background: color, borderRadius: 3, padding: '2px 5px', opacity: 0.85, cursor: 'pointer',
                    }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%', letterSpacing: '0.02em' }}>
                        {c.name.split(' —')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>
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

function EditModal({ campaign, onClose, onSave }) {
  const [startStr, setStartStr] = useState(msToDateStr(campaign.start_date))
  const [dueStr,   setDueStr]   = useState(msToDateStr(campaign.due_date))
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await api.updateDates(campaign.id, {
        start_date: dateStrToMs(startStr),
        due_date:   dateStrToMs(dueStr),
      })
      onSave({ ...campaign, start_date: String(dateStrToMs(startStr)), due_date: String(dateStrToMs(dueStr)) })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Editar datas</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#18181B', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.3, maxWidth: 260 }}>{campaign.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
        </div>

        {/* Date fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#71717A', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Início</span>
            <input type="date" value={startStr} onChange={e => setStartStr(e.target.value)}
              style={{ border: '1px solid #E4E4E7', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#18181B', outline: 'none', fontFamily: 'inherit' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#71717A', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Entrega / Lançamento</span>
            <input type="date" value={dueStr} onChange={e => setDueStr(e.target.value)}
              style={{ border: '1px solid #E4E4E7', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#18181B', outline: 'none', fontFamily: 'inherit' }} />
          </label>
        </div>

        {error && <p style={{ fontSize: 11, color: '#E24B4A', margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, border: '1px solid #E4E4E7', background: '#fff', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, color: '#71717A', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, border: 'none', background: '#18181B', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, color: '#fff', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : 'Salvar no ClickUp'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ onClose, onCreate }) {
  const [name,     setName]     = useState('')
  const [startStr, setStartStr] = useState('')
  const [dueStr,   setDueStr]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)

  async function handleCreate() {
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true)
    setError(null)
    try {
      const created = await api.createCampaign({
        name: name.trim(),
        start_date: dateStrToMs(startStr),
        due_date:   dateStrToMs(dueStr),
      })
      onCreate(created)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const inputStyle = {
    border: '1px solid #E4E4E7', borderRadius: 8, padding: '9px 12px',
    fontSize: 13, color: '#18181B', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 10, fontWeight: 700, color: '#71717A', letterSpacing: '0.06em', textTransform: 'uppercase' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Nova campanha</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#18181B', margin: 0, letterSpacing: '-0.02em' }}>Criar no ClickUp</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Nome da campanha *</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Aumento de preços — Julho 2026"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={inputStyle} autoFocus />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={labelStyle}>Início</span>
              <input type="date" value={startStr} onChange={e => setStartStr(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={labelStyle}>Lançamento</span>
              <input type="date" value={dueStr} onChange={e => setDueStr(e.target.value)} style={inputStyle} />
            </label>
          </div>
        </div>

        {error && <p style={{ fontSize: 11, color: '#E24B4A', margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, border: '1px solid #E4E4E7', background: '#fff', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, color: '#71717A', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={saving}
            style={{ flex: 2, border: 'none', background: '#E8472A', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, color: '#fff', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Criando…' : '+ Criar campanha'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [view,       setView]       = useState('calendar')
  const [campaigns,  setCampaigns]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(null)
  const [creating,   setCreating]   = useState(false)

  useEffect(() => {
    api.getCampaigns()
      .then(data => { setCampaigns(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleSave(updated) {
    setCampaigns(cs => cs.map(c => c.id === updated.id ? updated : c))
    setEditing(null)
  }

  function handleCreate(newCampaign) {
    setCampaigns(cs => [...cs, newCampaign])
    setCreating(false)
  }

  const today = new Date()
  const year  = today.getFullYear()

  return (
    <div style={{ padding: '40px 44px 64px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, color: '#A1A1AA', margin: '0 0 6px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Mission Control</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#18181B', margin: '0 0 6px', lineHeight: 1 }}>Launch Timeline</h1>
          <p style={{ fontSize: 12, color: '#A1A1AA', margin: 0 }}>
            {loading ? 'Carregando…' : `${campaigns.length} campanhas`}
            {!loading && <span> · clique em uma campanha para editar datas</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setCreating(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#E8472A', border: 'none', borderRadius: 8,
            padding: '7px 14px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '0.02em',
          }}>
            + Nova campanha
          </button>
          <div style={{ display: 'flex', border: '1px solid #E4E4E7', borderRadius: 8, overflow: 'hidden' }}>
            {[['gantt', 'Timeline'], ['calendar', 'Calendário']].map(([key, label]) => (
              <button key={key} onClick={() => setView(key)} style={{
                padding: '7px 16px', fontSize: 11, fontWeight: 600,
                background: view === key ? '#18181B' : 'transparent',
                color: view === key ? '#FFFFFF' : '#71717A',
                border: 'none', cursor: 'pointer', letterSpacing: '0.02em',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'gantt' ? (
        <MissionGantt />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <MonthGrid year={year} month={7} label="Julho 2026" campaigns={campaigns} onCampaignClick={setEditing} />
          <MonthGrid year={year} month={8} label="Agosto 2026" campaigns={campaigns} onCampaignClick={setEditing} />

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

      {editing  && <EditModal  campaign={editing} onClose={() => setEditing(null)}  onSave={handleSave} />}
      {creating && <CreateModal                   onClose={() => setCreating(false)} onCreate={handleCreate} />}
    </div>
  )
}
