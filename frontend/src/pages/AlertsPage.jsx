import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import ResponsavelFilter from '../components/ResponsavelFilter.jsx'
import RiskTimeline from '../components/RiskTimeline.jsx'
import { theme } from '../theme.js'
import { useTeam } from '../teamContext.jsx'

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
        responsavel: task.responsavel || null,
        start_date: task.start_date,
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
        responsavel: task.responsavel || null,
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
  const accentColor = isHigh ? theme.danger : theme.warning
  const borderColor = isHigh ? 'rgba(224,62,62,0.25)' : 'rgba(217,115,13,0.25)'
  const tagBg       = isHigh ? theme.dangerBg : theme.warningBg
  const tagBorder   = isHigh ? 'rgba(224,62,62,0.3)' : 'rgba(217,115,13,0.3)'
  const label       = isHigh ? 'Crítico' : 'Em risco'

  return (
    <div style={{
      background: theme.bg,
      border: `1px solid ${borderColor}`,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: theme.radius, padding: '13px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: accentColor, background: tagBg, border: `1px solid ${tagBorder}`,
            padding: '3px 8px', borderRadius: 99,
          }}>
            {label}
          </span>
          <Link to={`/campaigns/${alert.campanhaId}`}
            style={{ fontSize: 11.5, color: theme.textFaint, textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.color = theme.accent}
            onMouseLeave={e => e.currentTarget.style.color = theme.textFaint}>
            {alert.campanha}
          </Link>
          {alert.responsavel && (
            <span style={{ fontSize: 11, color: theme.textMuted, background: theme.bgSubtle, padding: '2px 8px', borderRadius: 99 }}>
              {alert.responsavel}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 600, color: theme.text, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={alert.tarefa}>{alert.tarefa}</p>
        <p style={{ fontSize: 12.5, color: theme.textMuted, margin: 0 }}>
          {alert.mensagem}{alert.fase ? ` · ${alert.fase}` : ''}{alert.canal ? ` · ${alert.canal}` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {alert.due_date && <span style={{ fontSize: 12, color: accentColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtDate(alert.due_date)}</span>}
        {alert.url && (
          <a href={alert.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.textFaint, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = theme.accent}
            onMouseLeave={e => e.currentTarget.style.color = theme.textFaint}>
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
      background: theme.bg,
      border: '1px solid rgba(47,158,68,0.22)',
      borderLeft: `3px solid ${theme.success}`,
      borderRadius: theme.radius, padding: '13px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.success, background: theme.successBg, border: '1px solid rgba(47,158,68,0.3)', padding: '3px 8px', borderRadius: 99 }}>
            Opportunity
          </span>
          <Link to={`/campaigns/${opp.campanhaId}`}
            style={{ fontSize: 11.5, color: theme.textFaint, textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.color = theme.success}
            onMouseLeave={e => e.currentTarget.style.color = theme.textFaint}>
            {opp.campanha}
          </Link>
          {opp.responsavel && (
            <span style={{ fontSize: 11, color: theme.textMuted, background: theme.bgSubtle, padding: '2px 8px', borderRadius: 99 }}>
              {opp.responsavel}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 600, color: theme.text, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={opp.tarefa}>{opp.tarefa}</p>
        <p style={{ fontSize: 12.5, color: theme.textMuted, margin: 0 }}>
          {opp.mensagem}{opp.fase ? ` · ${opp.fase}` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {opp.start_date && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 9.5, color: theme.textFaint, margin: '0 0 1px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>início</p>
            <span style={{ fontSize: 12, color: theme.success, fontWeight: 700 }}>{fmtDate(opp.start_date)}</span>
          </div>
        )}
        {opp.url && (
          <a href={opp.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.textFaint, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = theme.success}
            onMouseLeave={e => e.currentTarget.style.color = theme.textFaint}>
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
  const { role, name, liderados } = useTeam()
  const myTeam = role === 'lider' ? new Set([name, ...(liderados || [])]) : null

  const [alerts,        setAlerts]        = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [campaigns,     setCampaigns]     = useState([])
  const [allPeople,     setAllPeople]     = useState([])
  const [filter,        setFilter]        = useState('all')
  const [people,        setPeople]        = useState(() => myTeam || new Set())
  const [teamScope,     setTeamScope]     = useState('meu') // 'meu' | 'todo' — líder only
  const [view,          setView]          = useState('lista') // 'lista' | 'timeline'
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  function setScope(scope) {
    setTeamScope(scope)
    setPeople(scope === 'meu' ? (myTeam || new Set()) : new Set())
  }

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
      // Every responsável with a task, not just those with an active alert/opportunity —
      // otherwise someone with no signals right now can't even select themselves in the filter.
      const peopleSet = new Set()
      Object.values(subtasksByCampaign).forEach(tasks => tasks.forEach(t => { if (t.responsavel) peopleSet.add(t.responsavel) }))
      setAllPeople([...peopleSet].sort())
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const byCampaign = (x) => filter === 'all' || x.campanhaId === filter
  const byPerson   = (x) => people.size === 0 || (x.responsavel && people.has(x.responsavel))

  const visAlerts = alerts.filter(a => byCampaign(a) && byPerson(a))
  const visOpps   = opportunities.filter(o => byCampaign(o) && byPerson(o))
  const high   = visAlerts.filter(a => a.severidade === 'HIGH')
  const medium = visAlerts.filter(a => a.severidade === 'MEDIUM')

  const timelineItems = [
    ...high.map(a => ({ ...a, severity: 'HIGH' })),
    ...medium.map(a => ({ ...a, severity: 'MEDIUM' })),
    ...visOpps.map(o => ({ ...o, severity: 'OPPORTUNITY' })),
  ]

  return (
    <div style={{ padding: '44px 52px 64px', maxWidth: 1140 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, color: theme.textFaint, margin: '0 0 10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Mission Control</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: theme.text, margin: 0, lineHeight: 1 }}>Risk Signals</h1>
          {!loading && !error && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: theme.danger, fontWeight: 600 }}>{high.length} crítico{high.length !== 1 ? 's' : ''}</span>
              <span style={{ color: theme.border, fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: theme.warning, fontWeight: 600 }}>{medium.length} vencem hoje</span>
              <span style={{ color: theme.border, fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: theme.success, fontWeight: 600 }}>{visOpps.length} opportunit{visOpps.length !== 1 ? 'ies' : 'y'}</span>
            </div>
          )}
          {loading && <span style={{ fontSize: 13, color: theme.textFaint }}>Carregando…</span>}
          {error && <span style={{ fontSize: 13, color: theme.danger }}>{error}</span>}
        </div>
        <div style={{ height: 1, background: theme.border }} />
      </div>

      {/* Filters row: campaign pills · responsável selector · list/timeline toggle */}
      {!loading && !error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {campaigns.length > 1 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[{ id: 'all', name: 'Todas' }, ...campaigns].map(c => {
                  const active = filter === c.id
                  return (
                    <button key={c.id} onClick={() => setFilter(c.id)} style={{
                      fontSize: 12.5, fontWeight: active ? 600 : 400,
                      padding: '6px 14px', borderRadius: 99,
                      border: `1px solid ${active ? theme.borderStrong : 'transparent'}`,
                      background: active ? theme.bgActive : 'transparent',
                      color: active ? theme.text : theme.textFaint,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = theme.textMuted }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = theme.textFaint }}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            )}
            <ResponsavelFilter people={allPeople} selected={people} onChange={setPeople} />
            {role === 'lider' && (
              <div style={{ display: 'flex', gap: 3, background: theme.bgSubtle, borderRadius: theme.radiusSm, padding: 3 }}>
                {[['meu', 'Meu time'], ['todo', 'Todo o time']].map(([id, label]) => (
                  <button key={id} onClick={() => setScope(id)} style={{
                    fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: teamScope === id ? theme.bg : 'transparent',
                    color: teamScope === id ? theme.text : theme.textMuted,
                    boxShadow: teamScope === id ? `0 1px 2px ${theme.border}` : 'none',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista / Linha do tempo toggle */}
          <div style={{ display: 'flex', gap: 3, background: theme.bgSubtle, borderRadius: theme.radiusSm, padding: 3 }}>
            {[['lista', 'Lista'], ['timeline', 'Linha do tempo']].map(([id, label]) => (
              <button key={id} onClick={() => setView(id)} style={{
                fontSize: 12.5, fontWeight: 600, padding: '6px 13px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: view === id ? theme.bg : 'transparent',
                color: view === id ? theme.text : theme.textMuted,
                boxShadow: view === id ? `0 1px 2px ${theme.border}` : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && high.length === 0 && medium.length === 0 && visOpps.length === 0 && (
        <div style={{ background: theme.successBg, border: '1px solid rgba(47,158,68,0.25)', borderRadius: theme.radius + 4, padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14.5, fontWeight: 600, color: theme.success, margin: '0 0 4px' }}>Tudo no prazo</p>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>Nenhum sinal de risco detectado{people.size > 0 ? ' para as pessoas selecionadas' : ' nas campanhas ativas'}.</p>
        </div>
      )}

      {view === 'timeline' ? (
        timelineItems.length > 0 && <RiskTimeline items={timelineItems} />
      ) : (
        <>
          {/* Críticos */}
          {high.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <SectionLabel color={theme.danger}>Críticos</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {high.map(a => <AlertRow key={a.id} alert={a} />)}
              </div>
            </section>
          )}

          {/* Vencem hoje */}
          {medium.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <SectionLabel color={theme.warning}>Vencem hoje</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {medium.map(a => <AlertRow key={a.id} alert={a} />)}
              </div>
            </section>
          )}

          {/* Opportunities */}
          {visOpps.length > 0 && (
            <section>
              <SectionLabel color={theme.success}>Opportunities · pode adiantar</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visOpps.map(o => <OpportunityRow key={o.id} opp={o} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
