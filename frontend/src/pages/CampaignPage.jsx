import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import AlertCard from '../components/AlertCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Avatar from '../components/Avatar.jsx'
import { theme } from '../theme.js'

const TABS = ['Premissa', 'Tarefas', 'Por fase', 'Debriefing']

const FASE_ORDER = ['Kickoff', 'Estratégia', 'Produção', 'Pré-lançamento', 'Live', 'Retrospectiva']

const CLICKUP_TEAM = '31012836'

function clickupListUrl(listId) {
  return `https://app.clickup.com/${CLICKUP_TEAM}/v/li/${listId}`
}

function realStatus(task) {
  const now = Date.now()
  if (task.statusType === 'closed') return 'CONCLUIDA'
  if (task.due_date && Number(task.due_date) < now) return 'ATRASADA'
  const s = (task.status || '').toLowerCase()
  if (['em produção', 'em andamento', 'in progress'].includes(s)) return 'EM_PRODUCAO'
  return 'PENDENTE'
}

function fmtDate(ms) {
  if (!ms) return null
  const d = new Date(Number(ms))
  return { day: d.toLocaleDateString('pt-BR', { day: '2-digit' }), month: d.toLocaleDateString('pt-BR', { month: 'short' }) }
}

function ExtLink({ url, color = theme.textFaint, hoverColor = theme.accent }) {
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
      style={{ color, flexShrink: 0, display: 'flex' }}
      onMouseEnter={e => e.currentTarget.style.color = hoverColor}
      onMouseLeave={e => e.currentTarget.style.color = color}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M8 2h3v3M11 2L6.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  )
}

function TaskRow({ task }) {
  const rs   = realStatus(task)
  const date = fmtDate(task.due_date)
  const isLimitante = task.etapaLimitante

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px',
      background: theme.bg,
      border: `1px solid ${isLimitante ? 'rgba(224,62,62,0.3)' : theme.border}`,
      borderLeft: isLimitante ? `3px solid ${theme.danger}` : `1px solid ${theme.border}`,
      borderRadius: theme.radius,
    }}>
      <div style={{ width: 38, textAlign: 'center', flexShrink: 0 }}>
        {date ? (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1 }}>{date.day}</p>
            <p style={{ fontSize: 9, color: theme.textFaint, margin: 0, textTransform: 'uppercase' }}>{date.month}</p>
          </>
        ) : <span style={{ fontSize: 10, color: theme.textFaint }}>—</span>}
      </div>

      <div style={{ width: 1, height: 30, background: theme.border, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLimitante && <span style={{ fontSize: 9, color: theme.danger, fontWeight: 700, flexShrink: 0 }}>⚑ CRÍTICA</span>}
          <p style={{ fontSize: 13, fontWeight: 500, color: theme.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.name}
          </p>
        </div>
        <p style={{ fontSize: 10, color: theme.textFaint, margin: '2px 0 0' }}>
          {task.fase}{task.canal && task.canal !== 'Sem canal' ? ` · ${task.canal}` : ''}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {task.responsavel && <Avatar person={{ name: task.responsavel }} size={22} title={`R: ${task.responsavel}`} />}
        {task.aprovador   && <Avatar person={{ name: task.aprovador  }} size={22} title={`A: ${task.aprovador}`}   style={{ opacity: 0.55 }} />}
      </div>

      <StatusBadge status={rs} />
      <ExtLink url={task.url} />
    </div>
  )
}

function TabPremissa({ campaignId, name }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/campaigns/${campaignId}/direcionamento`).then(r => r.json()).catch(() => null),
      fetch(`/api/events`).then(r => r.json()).catch(() => []),
    ]).then(([dir, events]) => {
      const match = [...(events || [])]
        .filter(e => e.premissa && (
          e.missionId === campaignId ||
          (e.listLink && e.listLink.includes(campaignId))
        ))
        .pop()
      const premissa = match?.premissa || dir?.description || ''
      setData({ ...dir, description: premissa })
      setLoading(false)
    })
  }, [campaignId])

  const listUrl = clickupListUrl(campaignId)

  return (
    <div>
      {/* ClickUp list link */}
      <a href={listUrl} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontSize: 11, fontWeight: 600, color: theme.textMuted,
        background: theme.bgSubtle, border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusSm, padding: '7px 14px', textDecoration: 'none',
        marginBottom: 28,
      }}
        onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.borderColor = theme.borderStrong }}
        onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.borderColor = theme.border }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M8 2h3v3M11 2L6.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Ver lista no ClickUp
      </a>

      {loading && <p style={{ fontSize: 12, color: theme.textMuted }}>Carregando premissa…</p>}

      {!loading && data && (
        <div>
          {data.description ? (
            <div style={{
              background: theme.bgSubtle, border: `1px solid ${theme.border}`,
              borderRadius: theme.radius + 4, padding: '24px 28px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>Premissa da campanha</p>
              <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {data.description}
              </div>
            </div>
          ) : (
            <div style={{
              background: theme.bgSubtle, border: `1px solid ${theme.border}`,
              borderRadius: theme.radius + 4, padding: '32px 28px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: theme.textMuted, margin: '0 0 8px' }}>Sem premissa cadastrada</p>
              <p style={{ fontSize: 12, color: theme.textFaint, margin: '0 0 20px' }}>
                Adicione uma descrição na lista <strong style={{ color: theme.textMuted }}>{name}</strong> no ClickUp para ela aparecer aqui.
              </p>
              <a href={listUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 600, color: theme.accent,
                textDecoration: 'none',
              }}>
                Abrir lista no ClickUp →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TabTarefas({ tasks }) {
  const [faseFiltro, setFaseFiltro] = useState('Todos')
  const [respFiltro, setRespFiltro] = useState('Todos')

  const fases = ['Todos', ...FASE_ORDER.filter(f => tasks.some(t => t.fase === f))]
  const resps = ['Todos', ...Array.from(new Set(tasks.map(t => t.responsavel).filter(Boolean))).sort()]

  const filtered = tasks
    .filter(t => (faseFiltro === 'Todos' || t.fase === faseFiltro) && (respFiltro === 'Todos' || t.responsavel === respFiltro))
    .sort((a, b) => (Number(a.due_date) || 0) - (Number(b.due_date) || 0))

  const pill = (active, accent) => ({
    padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: active ? 600 : 400, cursor: 'pointer',
    border: `1px solid ${active ? (accent || theme.borderStrong) : theme.border}`,
    background: active ? (accent || theme.bgActive) : 'transparent',
    color: active ? (accent ? '#fff' : theme.text) : theme.textFaint,
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
        {fases.map(f => <button key={f} onClick={() => setFaseFiltro(f)} style={pill(faseFiltro === f)}>{f}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', marginRight: 2 }}>Responsável</span>
        {resps.map(r => <button key={r} onClick={() => setRespFiltro(r)} style={pill(respFiltro === r, theme.accent)}>{r}</button>)}
      </div>
      <p style={{ fontSize: 11, color: theme.textFaint, margin: '0 0 10px' }}>{filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(t => <TaskRow key={t.id} task={t} />)}
      </div>
    </div>
  )
}

function TabPorFase({ tasks }) {
  const grouped = {}
  for (const f of FASE_ORDER) {
    const ts = tasks.filter(t => t.fase === f).sort((a, b) => (Number(a.due_date) || 0) - (Number(b.due_date) || 0))
    if (ts.length) grouped[f] = ts
  }
  const outros = tasks.filter(t => !FASE_ORDER.includes(t.fase))
  if (outros.length) grouped['Outros'] = outros

  return (
    <div>
      {Object.entries(grouped).map(([fase, ts]) => (
        <div key={fase} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>{fase}</p>
            <span style={{ fontSize: 10, color: theme.textFaint }}>({ts.length})</span>
            <div style={{ flex: 1, height: 1, background: theme.border }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {ts.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function TabDebriefing({ tasks }) {
  const total = tasks.length
  const done  = tasks.filter(t => realStatus(t) === 'CONCLUIDA').length
  const late  = tasks.filter(t => realStatus(t) === 'ATRASADA').length
  const pct   = total ? Math.round(done / total * 100) : 0

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total tarefas', value: total,      color: theme.text },
          { label: 'Concluídas',    value: done,       color: theme.success },
          { label: 'Atrasadas',     value: late,       color: late > 0 ? theme.danger : theme.success },
          { label: 'No prazo',      value: `${pct}%`,  color: pct >= 70 ? theme.success : theme.danger },
        ].map(s => (
          <div key={s.label} style={{ background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: theme.radius + 4, padding: '16px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: theme.textFaint, fontStyle: 'italic' }}>
        Debriefing completo disponível após o encerramento da campanha.
      </p>
    </div>
  )
}

export default function CampaignPage() {
  const { id }       = useParams()
  const { state }    = useLocation()
  const [tab,     setTab]     = useState('Premissa')
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setTasks([])
    fetch(`/api/campaigns/${id}/subtasks`)
      .then(r => r.json())
      .then(subtasks => {
        if (!Array.isArray(subtasks)) {
          setError(`Resposta inesperada: ${JSON.stringify(subtasks)}`)
        } else {
          setTasks(subtasks)
        }
        setLoading(false)
      })
      .catch(e => {
        setError(`Erro: ${e.message}`)
        setLoading(false)
      })
  }, [id])

  const concluidas = tasks.filter(t => realStatus(t) === 'CONCLUIDA').length
  const atrasadas  = tasks.filter(t => realStatus(t) === 'ATRASADA').length
  const criticas   = tasks.filter(t => t.etapaLimitante && realStatus(t) === 'ATRASADA').length

  const name = state?.name || '—'

  return (
    <div style={{ padding: '32px 40px 56px', maxWidth: 960 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Link to="/" style={{ fontSize: 12, color: theme.textFaint, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = theme.textMuted}
          onMouseLeave={e => e.currentTarget.style.color = theme.textFaint}>
          Dashboard
        </Link>
        <span style={{ color: theme.border, fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>{name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${theme.border}` }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: theme.text, margin: 0 }}>{name}</h1>
            {criticas > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, color: theme.danger, background: theme.dangerBg, border: '1px solid rgba(224,62,62,0.25)', padding: '3px 9px', borderRadius: 99 }}>
                {criticas} crítica{criticas > 1 ? 's' : ''} atrasada{criticas > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>
            {loading ? 'Carregando…' : `${tasks.length} tarefas · ${concluidas} concluídas · ${atrasadas} atrasadas`}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: theme.dangerBg, border: '1px solid rgba(224,62,62,0.2)', borderRadius: theme.radius, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: theme.danger, margin: 0 }}>Erro ao carregar tarefas: {error}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${theme.border}`, marginBottom: 28 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? theme.text : theme.textFaint, background: 'none', border: 'none',
            cursor: 'pointer', borderBottom: `2px solid ${tab === t ? theme.accent : 'transparent'}`, marginBottom: -1,
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Premissa' && <TabPremissa campaignId={id} name={name} />}

      {tab !== 'Premissa' && loading ? (
        <p style={{ fontSize: 12, color: theme.textMuted }}>Carregando tarefas do ClickUp…</p>
      ) : tab !== 'Premissa' && tasks.length === 0 && !error ? (
        <div style={{ background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: theme.radius + 4, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted, margin: '0 0 6px' }}>
            Nenhuma tarefa encontrada
          </p>
          <p style={{ fontSize: 12, color: theme.textFaint, margin: '0 0 16px' }}>
            A campanha <strong style={{ color: theme.textMuted }}>{name}</strong> não tem tarefas cadastradas no ClickUp ainda.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: '7px 14px', cursor: 'pointer' }}>
            Recarregar
          </button>
        </div>
      ) : (
        <>
          {tab === 'Tarefas'    && <TabTarefas    tasks={tasks} />}
          {tab === 'Por fase'   && <TabPorFase    tasks={tasks} />}
          {tab === 'Debriefing' && <TabDebriefing tasks={tasks} />}
        </>
      )}
    </div>
  )
}
