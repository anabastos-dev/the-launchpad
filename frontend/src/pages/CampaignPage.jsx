import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import AlertCard from '../components/AlertCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Avatar from '../components/Avatar.jsx'

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

function ExtLink({ url, color = 'rgba(255,255,255,0.25)', hoverColor = '#E8472A' }) {
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
      background: '#18181B',
      border: `1px solid ${isLimitante ? 'rgba(226,75,74,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderLeft: isLimitante ? '3px solid #E24B4A' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
    }}>
      <div style={{ width: 38, textAlign: 'center', flexShrink: 0 }}>
        {date ? (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5', margin: 0, lineHeight: 1 }}>{date.day}</p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase' }}>{date.month}</p>
          </>
        ) : <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>—</span>}
      </div>

      <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLimitante && <span style={{ fontSize: 9, color: '#F87171', fontWeight: 700, flexShrink: 0 }}>⚑ CRÍTICA</span>}
          <p style={{ fontSize: 13, fontWeight: 500, color: '#F4F4F5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.name}
          </p>
        </div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
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
        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '7px 14px', textDecoration: 'none',
        marginBottom: 28, transition: 'all 0.12s',
      }}
        onMouseEnter={e => { e.currentTarget.style.color = '#F4F4F5'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M8 2h3v3M11 2L6.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Ver lista no ClickUp
      </a>

      {loading && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Carregando premissa…</p>}

      {!loading && data && (
        <div>
          {data.description ? (
            <div style={{
              background: '#18181B', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '24px 28px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>Premissa da campanha</p>
              <div style={{ fontSize: 14, color: '#E4E4E7', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {data.description}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#18181B', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '32px 28px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>Sem premissa cadastrada</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '0 0 20px' }}>
                Adicione uma descrição na lista <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{name}</strong> no ClickUp para ela aparecer aqui.
              </p>
              <a href={listUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 600, color: '#E8472A',
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
    border: `1px solid ${active ? (accent || 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.08)'}`,
    background: active ? (accent || 'rgba(255,255,255,0.12)') : 'transparent',
    color: active ? (accent ? '#fff' : '#F4F4F5') : 'rgba(255,255,255,0.35)',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
        {fases.map(f => <button key={f} onClick={() => setFaseFiltro(f)} style={pill(faseFiltro === f)}>{f}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.07em', textTransform: 'uppercase', marginRight: 2 }}>Responsável</span>
        {resps.map(r => <button key={r} onClick={() => setRespFiltro(r)} style={pill(respFiltro === r, '#E8472A')}>{r}</button>)}
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 10px' }}>{filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}</p>
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
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>{fase}</p>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>({ts.length})</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
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
          { label: 'Total tarefas', value: total,      color: '#F4F4F5' },
          { label: 'Concluídas',    value: done,       color: '#4ADE80' },
          { label: 'Atrasadas',     value: late,       color: late > 0 ? '#F87171' : '#4ADE80' },
          { label: 'No prazo',      value: `${pct}%`,  color: pct >= 70 ? '#4ADE80' : '#F87171' },
        ].map(s => (
          <div key={s.label} style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
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
        <Link to="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
          Dashboard
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#F4F4F5', margin: 0 }}>{name}</h1>
            {criticas > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#F87171', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', padding: '3px 9px', borderRadius: 99 }}>
                {criticas} crítica{criticas > 1 ? 's' : ''} atrasada{criticas > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {loading ? 'Carregando…' : `${tasks.length} tarefas · ${concluidas} concluídas · ${atrasadas} atrasadas`}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#F87171', margin: 0 }}>Erro ao carregar tarefas: {error}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 28 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? '#F4F4F5' : 'rgba(255,255,255,0.35)', background: 'none', border: 'none',
            cursor: 'pointer', borderBottom: `2px solid ${tab === t ? '#E8472A' : 'transparent'}`, marginBottom: -1,
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Premissa' && <TabPremissa campaignId={id} name={name} />}

      {tab !== 'Premissa' && loading ? (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Carregando tarefas do ClickUp…</p>
      ) : tab !== 'Premissa' && tasks.length === 0 && !error ? (
        <div style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>
            Nenhuma tarefa encontrada
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '0 0 16px' }}>
            A campanha <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{name}</strong> não tem tarefas cadastradas no ClickUp ainda.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
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
