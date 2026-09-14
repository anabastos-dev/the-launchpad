import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

const FASE_ORDER = ['Kickoff', 'Estratégia', 'Produção', 'Pré-lançamento', 'Live', 'Retrospectiva']

const INACTIVE_STATUSES = new Set(['cancelada', 'cancelado', 'bloqueada', 'bloqueado', 'blocked', 'cancelled'])

function isClosed(task) {
  if ((task.statusType || '').toLowerCase() === 'closed') return true
  return INACTIVE_STATUSES.has((task.status || '').toLowerCase())
}

function diasAte(ms) {
  return Math.ceil((Number(ms) - Date.now()) / 86400000)
}

function computeSignals(campaigns, subtasksByCampaign) {
  const alerts       = []
  const opportunities = []
  const now        = Date.now()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)
  const todayStartMs = todayStart.getTime()
  const todayEndMs   = todayEnd.getTime()

  for (const campaign of campaigns) {
    const tasks     = subtasksByCampaign[campaign.id] || []
    const openTasks = tasks.filter(t => !isClosed(t))

    const limitanteByFase = {}
    for (const t of tasks) {
      if (!t.etapaLimitante) continue
      if (!limitanteByFase[t.fase]) limitanteByFase[t.fase] = []
      limitanteByFase[t.fase].push(t)
    }

    for (const task of openTasks) {
      const due      = task.due_date ? Number(task.due_date) : null
      const late     = due !== null && due < todayStartMs
      const dueToday = due !== null && due >= todayStartMs && due <= todayEndMs
      const limitante = task.etapaLimitante

      const base = {
        id:         task.id,
        campanha:   campaign.name,
        campanhaId: campaign.id,
        tarefa:     task.name,
        fase:       task.fase,
        canal:      task.canal,
        due_date:   task.due_date,
        url:        task.url,
      }

      if (late) {
        alerts.push({ ...base, id: `${task.id}_l`, severidade: 'HIGH',
          mensagem: `Atrasada ${Math.abs(diasAte(due))} dia(s)${limitante ? ' · etapa limitante' : ''}` })
      } else if (dueToday) {
        alerts.push({ ...base, id: `${task.id}_t`, severidade: 'MEDIUM',
          mensagem: `Vence hoje${limitante ? ' · etapa limitante' : ''}` })
      }
    }

    for (const task of openTasks) {
      const taskFaseIdx = FASE_ORDER.indexOf(task.fase)
      if (taskFaseIdx <= 0) continue

      const earlierLimitantes = FASE_ORDER
        .slice(0, taskFaseIdx)
        .flatMap(f => limitanteByFase[f] || [])

      if (earlierLimitantes.length === 0) continue
      if (!earlierLimitantes.every(lt => isClosed(lt))) continue

      const start = task.start_date ? Number(task.start_date) : null
      if (!start || start <= now + 3 * 86400000) continue

      opportunities.push({
        id:         `${task.id}_opp`,
        campanha:   campaign.name,
        campanhaId: campaign.id,
        tarefa:     task.name,
        fase:       task.fase,
        start_date: task.start_date,
        due_date:   task.due_date,
        url:        task.url,
        mensagem:   `${earlierLimitantes.length} etapa${earlierLimitantes.length > 1 ? 's' : ''} limitante${earlierLimitantes.length > 1 ? 's' : ''} anterior${earlierLimitantes.length > 1 ? 'es' : ''} concluída${earlierLimitantes.length > 1 ? 's' : ''} — pode adiantar`,
      })
    }
  }

  alerts.sort((a, b) => {
    if (a.severidade !== b.severidade) return a.severidade === 'HIGH' ? -1 : 1
    return (Number(a.due_date) || 0) - (Number(b.due_date) || 0)
  })
  opportunities.sort((a, b) => (Number(a.start_date) || 0) - (Number(b.start_date) || 0))

  return { alerts, opportunities }
}

function fmtDate(ms) {
  if (!ms) return null
  return new Date(Number(ms)).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const EXT_ICON = (
  <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
    <path d="M5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M8 2h3v3M11 2L6.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function AlertRow({ alert }) {
  const isHigh = alert.severidade === 'HIGH'
  const accentColor = isHigh ? '#F87171' : '#FBBF24'
  const borderColor = isHigh ? 'rgba(248,113,113,0.18)' : 'rgba(251,191,36,0.18)'
  const leftBorder  = isHigh ? '#E24B4A' : '#F59E0B'
  const tagBg       = isHigh ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)'
  const tagBorder   = isHigh ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'
  const label       = isHigh ? 'Crítico' : 'Em risco'

  return (
    <div style={{
      background: '#18181B',
      border: `1px solid ${borderColor}`,
      borderLeft: `3px solid ${leftBorder}`,
      borderRadius: 10, padding: '13px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: accentColor, background: tagBg, border: `1px solid ${tagBorder}`,
            padding: '2px 7px', borderRadius: 99,
          }}>
            {label}
          </span>
          <Link to={`/campaigns/${alert.campanhaId}`}
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.color = '#E8472A'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
            {alert.campanha}
          </Link>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F5', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.tarefa}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {alert.mensagem}{alert.fase ? ` · ${alert.fase}` : ''}{alert.canal ? ` · ${alert.canal}` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {alert.due_date && <span style={{ fontSize: 10.5, color: accentColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtDate(alert.due_date)}</span>}
        {alert.url && (
          <a href={alert.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.25)', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = '#E8472A'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
            {EXT_ICON}
          </a>
        )}
      </div>
    </div>
  )
}

function OpportunityRow({ opp }) {
  return (
    <div style={{
      background: '#18181B',
      border: '1px solid rgba(74,222,128,0.15)',
      borderLeft: '3px solid #22C55E',
      borderRadius: 10, padding: '13px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4ADE80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', padding: '2px 7px', borderRadius: 99 }}>
            Opportunity
          </span>
          <Link to={`/campaigns/${opp.campanhaId}`}
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.color = '#22C55E'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
            {opp.campanha}
          </Link>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F5', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.tarefa}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {opp.mensagem}{opp.fase ? ` · ${opp.fase}` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {opp.start_date && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', margin: '0 0 1px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>início</p>
            <span style={{ fontSize: 10.5, color: '#4ADE80', fontWeight: 700 }}>{fmtDate(opp.start_date)}</span>
          </div>
        )}
        {opp.url && (
          <a href={opp.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.25)', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = '#22C55E'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
            {EXT_ICON}
          </a>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
      <span style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <p style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{children}</p>
    </div>
  )
}

export default function AlertsPage() {
  const [alerts,        setAlerts]        = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [campaigns,     setCampaigns]     = useState([])
  const [filter,        setFilter]        = useState('all')
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  useEffect(() => {
    api.getCampaigns().then(async cs => {
      setCampaigns(cs)
      const results = await Promise.allSettled(
        cs.map(c => fetch(`/api/campaigns/${c.id}/subtasks`).then(r => r.json()))
      )
      const subtasksByCampaign = {}
      cs.forEach((c, i) => {
        subtasksByCampaign[c.id] = results[i].status === 'fulfilled' && Array.isArray(results[i].value)
          ? results[i].value : []
      })
      const { alerts, opportunities } = computeSignals(cs, subtasksByCampaign)
      setAlerts(alerts)
      setOpportunities(opportunities)
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const visAlerts = filter === 'all' ? alerts : alerts.filter(a => a.campanhaId === filter)
  const visOpps   = filter === 'all' ? opportunities : opportunities.filter(o => o.campanhaId === filter)
  const high   = visAlerts.filter(a => a.severidade === 'HIGH')
  const medium = visAlerts.filter(a => a.severidade === 'MEDIUM')

  return (
    <div style={{ padding: '44px 52px 64px', maxWidth: 880 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Mission Control</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: '#F4F4F5', margin: 0, lineHeight: 1 }}>Risk Signals</h1>
          {!loading && !error && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#F87171', fontWeight: 600 }}>{high.length} crítico{high.length !== 1 ? 's' : ''}</span>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, color: '#FBBF24', fontWeight: 600 }}>{medium.length} vencem hoje</span>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>{visOpps.length} opportunit{visOpps.length !== 1 ? 'ies' : 'y'}</span>
            </div>
          )}
          {loading && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Carregando…</span>}
          {error && <span style={{ fontSize: 12, color: '#F87171' }}>{error}</span>}
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* Campaign filter pills */}
      {!loading && !error && campaigns.length > 1 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 32 }}>
          {[{ id: 'all', name: 'Todas' }, ...campaigns].map(c => {
            const active = filter === c.id
            return (
              <button key={c.id} onClick={() => setFilter(c.id)} style={{
                fontSize: 11.5, fontWeight: active ? 600 : 400,
                padding: '5px 14px', borderRadius: 99,
                border: `1px solid ${active ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
                background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                color: active ? '#F4F4F5' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && high.length === 0 && medium.length === 0 && visOpps.length === 0 && (
        <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#4ADE80', margin: '0 0 4px' }}>Tudo no prazo</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Nenhum sinal de risco detectado nas campanhas ativas.</p>
        </div>
      )}

      {/* Críticos */}
      {high.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <SectionLabel color="#E24B4A">Críticos</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {high.map(a => <AlertRow key={a.id} alert={a} />)}
          </div>
        </section>
      )}

      {/* Vencem hoje */}
      {medium.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <SectionLabel color="#F59E0B">Vencem hoje</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {medium.map(a => <AlertRow key={a.id} alert={a} />)}
          </div>
        </section>
      )}

      {/* Opportunities */}
      {visOpps.length > 0 && (
        <section>
          <SectionLabel color="#22C55E">Opportunities · pode adiantar</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {visOpps.map(o => <OpportunityRow key={o.id} opp={o} />)}
          </div>
        </section>
      )}
    </div>
  )
}
