import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api.js'
import AlertCard from '../components/AlertCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Avatar from '../components/Avatar.jsx'

const TABS = ['Tarefas', 'Por fase', 'Debriefing']

const FASE_ORDER = ['Kickoff', 'Estratégia', 'Produção', 'Pré-lançamento', 'Live', 'Retrospectiva']

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

function ClickUpLink({ url }) {
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
      style={{ color: '#A1A1AA', flexShrink: 0 }}
      onMouseEnter={e => e.currentTarget.style.color = '#7C3AED'}
      onMouseLeave={e => e.currentTarget.style.color = '#A1A1AA'}>
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
      background: '#FFFFFF',
      border: `1px solid ${isLimitante ? '#FECACA' : '#E4E4E7'}`,
      borderLeft: isLimitante ? '3px solid #E24B4A' : '1px solid #E4E4E7',
      borderRadius: 10,
    }}>
      {/* Date */}
      <div style={{ width: 38, textAlign: 'center', flexShrink: 0 }}>
        {date ? (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#18181B', margin: 0, lineHeight: 1 }}>{date.day}</p>
            <p style={{ fontSize: 9, color: '#888780', margin: 0, textTransform: 'uppercase' }}>{date.month}</p>
          </>
        ) : <span style={{ fontSize: 10, color: '#D3D1C7' }}>—</span>}
      </div>

      <div style={{ width: 1, height: 30, background: '#E4E4E7', flexShrink: 0 }} />

      {/* Name + fase */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLimitante && <span style={{ fontSize: 9, color: '#E24B4A', fontWeight: 700, flexShrink: 0 }}>⚑ CRÍTICA</span>}
          <p style={{ fontSize: 13, fontWeight: 500, color: '#18181B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.name}
          </p>
        </div>
        <p style={{ fontSize: 10, color: '#888780', margin: '2px 0 0' }}>
          {task.fase}{task.canal && task.canal !== 'Sem canal' ? ` · ${task.canal}` : ''}
        </p>
      </div>

      {/* RACI avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {task.responsavel && <Avatar person={{ name: task.responsavel }} size={22} title={`R: ${task.responsavel}`} />}
        {task.aprovador   && <Avatar person={{ name: task.aprovador  }} size={22} title={`A: ${task.aprovador}`}   style={{ opacity: 0.55 }} />}
      </div>

      <StatusBadge status={rs} />
      <ClickUpLink url={task.url} />
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
    padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid',
    borderColor: active ? (accent || '#18181B') : '#E4E4E7',
    background:  active ? (accent || '#18181B') : '#FFFFFF',
    color: active ? '#FFFFFF' : '#71717A',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
        {fases.map(f => <button key={f} onClick={() => setFaseFiltro(f)} style={pill(faseFiltro === f)}>{f}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.07em', textTransform: 'uppercase', marginRight: 2 }}>Responsável</span>
        {resps.map(r => <button key={r} onClick={() => setRespFiltro(r)} style={pill(respFiltro === r, '#E8472A')}>{r}</button>)}
      </div>
      <p style={{ fontSize: 11, color: '#A1A1AA', margin: '0 0 10px' }}>{filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}</p>
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
            <p style={{ fontSize: 10, fontWeight: 700, color: '#888780', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>{fase}</p>
            <span style={{ fontSize: 10, color: '#A1A1AA' }}>({ts.length})</span>
            <div style={{ flex: 1, height: 1, background: '#E4E4E7' }} />
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
          { label: 'Total tarefas', value: total, color: '#18181B' },
          { label: 'Concluídas',    value: done,  color: '#3B6D11' },
          { label: 'Atrasadas',     value: late,  color: late > 0 ? '#E24B4A' : '#3B6D11' },
          { label: 'No prazo',      value: `${pct}%`, color: pct >= 70 ? '#3B6D11' : '#E24B4A' },
        ].map(s => (
          <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#B4B2A9', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#A1A1AA', fontStyle: 'italic' }}>
        Debriefing completo disponível após o encerramento da campanha.
      </p>
    </div>
  )
}

export default function CampaignPage() {
  const { id } = useParams()
  const [tab,      setTab]      = useState('Tarefas')
  const [tasks,    setTasks]    = useState([])
  const [campaign, setCampaign] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getCampaigns(),
      api.getSubtasks ? api.getSubtasks(id) : fetch(`/api/campaigns/${id}/subtasks`).then(r => r.json()),
    ]).then(([campaigns, subtasks]) => {
      setCampaign(campaigns.find(c => c.id === id) || null)
      setTasks(subtasks)
      setLoading(false)
    }).catch(e => {
      setError(e.message)
      setLoading(false)
    })
  }, [id])

  const concluidas  = tasks.filter(t => realStatus(t) === 'CONCLUIDA').length
  const atrasadas   = tasks.filter(t => realStatus(t) === 'ATRASADA').length
  const criticas    = tasks.filter(t => t.etapaLimitante && realStatus(t) === 'ATRASADA').length

  const launchMs    = campaign?.due_date ? Number(campaign.due_date) : null
  const daysToLaunch = launchMs ? Math.ceil((launchMs - Date.now()) / 86400000) : null

  const name = campaign?.name || '—'

  return (
    <div style={{ padding: '32px 40px 56px', maxWidth: 960 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Link to="/" style={{ fontSize: 12, color: '#888780', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ color: '#D3D1C7', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: '#18181B', fontWeight: 500 }}>{name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #E8E6E0' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#18181B', margin: 0 }}>{name}</h1>
            {criticas > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FECACA', padding: '3px 9px', borderRadius: 99 }}>
                {criticas} crítica{criticas > 1 ? 's' : ''} atrasada{criticas > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#888780', margin: 0 }}>
            {loading ? 'Carregando…' : `${tasks.length} tarefas · ${concluidas} concluídas · ${atrasadas} atrasadas`}
          </p>
        </div>
        {daysToLaunch !== null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: daysToLaunch <= 3 ? '#E24B4A' : daysToLaunch <= 7 ? '#EF9F27' : '#185FA5', margin: 0, lineHeight: 1 }}>
              {daysToLaunch > 0 ? `D-${daysToLaunch}` : daysToLaunch === 0 ? 'D0' : `D+${Math.abs(daysToLaunch)}`}
            </p>
            <p style={{ fontSize: 11, color: '#888780', margin: '3px 0 0' }}>dias para o lançamento</p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#991B1B', margin: 0 }}>Erro ao carregar tarefas: {error}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E8E6E0', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? '#18181B' : '#888780', background: 'none', border: 'none',
            cursor: 'pointer', borderBottom: `2px solid ${tab === t ? '#E8472A' : 'transparent'}`, marginBottom: -1,
          }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: '#A1A1AA' }}>Carregando tarefas do ClickUp…</p>
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
