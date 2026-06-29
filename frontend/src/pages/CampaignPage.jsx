import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CAMPAIGNS, ALERTS, TASKS_C1 } from '../mock.js'
import AlertCard from '../components/AlertCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import PhaseBar from '../components/PhaseBar.jsx'
import Avatar from '../components/Avatar.jsx'

const TABS = ['Visão geral', 'Assets', 'Calendário', 'Ofertas', 'Debriefing']

function TabVisaoGeral({ campaign, alerts, tasks }) {
  const concluidas = tasks.filter(t => t.real === 'CONCLUIDA').length
  const atrasadas  = tasks.filter(t => t.real === 'ATRASADA').length
  const bloqueadas = tasks.filter(t => t.real === 'BLOQUEADA').length
  const emRisco    = tasks.filter(t => t.real === 'EM_RISCO').length

  return (
    <div>
      {/* Phase bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#888780', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>Progresso da campanha</p>
        <PhaseBar fases={campaign.fases} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: '#888780' }}>Fase atual: <strong style={{ color: '#18181B' }}>{campaign.fase}</strong></span>
          <span style={{ fontSize: 11, color: '#888780' }}>{campaign.progress}% concluído</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Concluídas', value: concluidas, color: '#3B6D11' },
          { label: 'Atrasadas',  value: atrasadas,  color: atrasadas  > 0 ? '#E24B4A' : '#3B6D11' },
          { label: 'Bloqueadas', value: bloqueadas, color: bloqueadas > 0 ? '#BA7517' : '#3B6D11' },
          { label: 'Em risco',   value: emRisco,    color: emRisco   > 0 ? '#BA7517' : '#3B6D11' },
        ].map(s => (
          <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#B4B2A9', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#888780', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>Alertas desta campanha</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(a => <AlertCard key={a.id} alerta={a} />)}
          </div>
        </div>
      )}
    </div>
  )
}

const CLICKUP_BASE = 'https://app.clickup.com/t'

function ClickUpLink({ taskId }) {
  if (!taskId) return null
  return (
    <a
      href={`${CLICKUP_BASE}/${taskId}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir no ClickUp"
      onClick={e => e.stopPropagation()}
      style={{ display: 'flex', alignItems: 'center', color: '#A1A1AA', textDecoration: 'none', flexShrink: 0, padding: '2px' }}
      onMouseEnter={e => e.currentTarget.style.color = '#7C3AED'}
      onMouseLeave={e => e.currentTarget.style.color = '#A1A1AA'}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M1.5 6.5C1.5 3.74 3.74 1.5 6.5 1.5S11.5 3.74 11.5 6.5 9.26 11.5 6.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M3.5 9.5L6.5 6.5M6.5 6.5H4M6.5 6.5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="4,3.5 2,5.5 4,7.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  )
}

function TaskRow({ task }) {
  const isHandoff = task.isHandoff
  const isLimitante = task.etapaLimitante

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
      background: isHandoff ? '#EFF6FF' : '#FFFFFF',
      border: `1px solid ${isHandoff ? '#BFDBFE' : isLimitante ? '#FECACA' : '#E4E4E7'}`,
      borderRadius: 10,
      borderLeft: isLimitante && !isHandoff ? '3px solid #E24B4A' : isHandoff ? '3px solid #185FA5' : undefined,
    }}>
      {/* Date */}
      <div style={{ width: 42, textAlign: 'center', flexShrink: 0 }}>
        {task.due ? (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#18181B', margin: 0, lineHeight: 1 }}>
              {new Date(task.due).toLocaleDateString('pt-BR', { day: '2-digit' })}
            </p>
            <p style={{ fontSize: 9, color: '#888780', margin: 0, textTransform: 'uppercase' }}>
              {new Date(task.due).toLocaleDateString('pt-BR', { month: 'short' })}
            </p>
          </>
        ) : <span style={{ fontSize: 10, color: '#D3D1C7' }}>—</span>}
      </div>

      <div style={{ width: 1, height: 32, background: '#E4E4E7', flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isHandoff && <span style={{ fontSize: 10, color: '#185FA5', fontWeight: 700 }}>HANDOFF</span>}
          {isLimitante && !isHandoff && <span style={{ fontSize: 10, color: '#E24B4A', fontWeight: 700 }}>⚑ CRÍTICA</span>}
          <p style={{ fontSize: 13, fontWeight: 500, color: '#18181B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.name.replace('✅ HANDOFF ', '')}
          </p>
        </div>
        <p style={{ fontSize: 11, color: '#888780', margin: '2px 0 0' }}>{task.fase}</p>
      </div>

      <Avatar person={task.responsavel} size={24} />
      <StatusBadge status={task.real} />
      <ClickUpLink taskId={task.id} />
    </div>
  )
}

function TabAssets({ tasks }) {
  const [faseFiltro, setFaseFiltro] = useState('Todos')
  const [respFiltro, setRespFiltro] = useState('Todos')

  const fases = ['Todos', 'Estratégia', 'Kickoff', 'Produção', 'Pré-lançamento', 'Live']
  const responsaveis = ['Todos', ...Array.from(new Set(tasks.map(t => t.responsavel?.name).filter(Boolean))).sort()]

  const filtered = tasks.filter(t => {
    const okFase = faseFiltro === 'Todos' || t.fase === faseFiltro
    const okResp = respFiltro === 'Todos' || t.responsavel?.name === respFiltro
    return okFase && okResp
  })

  const pillStyle = (active) => ({
    padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: '1px solid',
    borderColor: active ? '#18181B' : '#E4E4E7',
    background: active ? '#18181B' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#71717A',
  })

  return (
    <div>
      {/* Fase filter */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
        {fases.map(f => (
          <button key={f} onClick={() => setFaseFiltro(f)} style={pillStyle(faseFiltro === f)}>{f}</button>
        ))}
      </div>

      {/* Responsável filter */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.07em', textTransform: 'uppercase', marginRight: 2 }}>Responsável</span>
        {responsaveis.map(r => (
          <button key={r} onClick={() => setRespFiltro(r)} style={{ ...pillStyle(respFiltro === r), background: respFiltro === r ? '#E8472A' : '#FFFFFF', borderColor: respFiltro === r ? '#E8472A' : '#E4E4E7', color: respFiltro === r ? '#FFFFFF' : '#71717A' }}>
            {r}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 11, color: '#A1A1AA', margin: '0 0 10px' }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(t => <TaskRow key={t.id} task={t} />)}
      </div>
    </div>
  )
}

function TabCalendario({ tasks }) {
  const byFase = {}
  for (const t of tasks) {
    if (!byFase[t.fase]) byFase[t.fase] = []
    byFase[t.fase].push(t)
  }

  return (
    <div>
      {Object.entries(byFase).map(([fase, ts]) => (
        <div key={fase} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#888780', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>{fase}</p>
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

function TabOfertas() {
  const items = [
    { label: 'Produto principal', value: 'Camiseta Gola Alta Inverno — 3 cores' },
    { label: 'Preço', value: 'R$ 189,00 (de R$ 249,00)' },
    { label: 'Desconto', value: '24% off' },
    { label: 'Frete', value: 'Grátis acima de R$ 199' },
    { label: 'Validade da oferta', value: '15/07 a 22/07/2026 (7 dias)' },
    { label: 'Prazo de entrega', value: 'Até 5 dias úteis' },
    { label: 'Tagline', value: '"A camiseta que sobrevive ao inverno e ao verão."' },
    { label: 'Tom de voz', value: 'Direto, confiante, sem exagero. Foco no produto.' },
  ]

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 14, overflow: 'hidden' }}>
      {items.map((item, i) => (
        <div key={item.label} style={{ display: 'flex', gap: 24, padding: '14px 20px', borderBottom: i < items.length - 1 ? '1px solid #F1EFE8' : 'none' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#888780', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0, minWidth: 160, flexShrink: 0 }}>{item.label}</p>
          <p style={{ fontSize: 13, color: '#18181B', margin: 0, fontWeight: 500 }}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function TabDebriefing({ tasks }) {
  const total = tasks.length
  const done  = tasks.filter(t => t.real === 'CONCLUIDA').length
  const late  = tasks.filter(t => t.real === 'ATRASADA').length
  const pct   = total > 0 ? Math.round(done / total * 100) : 0

  const retro = [
    { label: 'O que funcionou', icon: '✓', color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97', items: ['Copy aprovada 3 dias antes', 'Handoff Design → Copy sem atrasos', 'Brief estratégico claro e detalhado'] },
    { label: 'O que atrasou', icon: '!', color: '#991B1B', bg: '#FEF2F2', border: '#FECACA', items: ['Banner LP atrasou 8 dias (Jonathan sobrecarregado)', 'Handoff Design → Canais não foi fechado a tempo', 'Dependência de aprovação do João criou gargalo'] },
    { label: 'O que muda', icon: '→', color: '#185FA5', bg: '#EFF6FF', border: '#BFDBFE', items: ['Criar buffer de 2 dias em tasks etapa limitante', 'Handoff precisa de checklist antes de fechar', 'Aprovações do João bloqueadas por prazo máx. 24h'] },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total tasks', value: total, color: '#18181B' },
          { label: 'Concluídas', value: done, color: '#3B6D11' },
          { label: 'Atrasadas', value: late, color: late > 0 ? '#E24B4A' : '#3B6D11' },
          { label: 'No prazo', value: `${pct}%`, color: pct >= 70 ? '#3B6D11' : '#E24B4A' },
        ].map(s => (
          <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#B4B2A9', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {retro.map(col => (
          <div key={col.label} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 14, padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: col.color, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{col.icon}</span>
              <p style={{ fontSize: 11, fontWeight: 700, color: col.color, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>{col.label}</p>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.items.map((item, i) => (
                <li key={i} style={{ fontSize: 12, color: '#2C2C2A', lineHeight: 1.5, paddingLeft: 12, borderLeft: `2px solid ${col.border}` }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CampaignPage() {
  const { id } = useParams()
  const [tab, setTab] = useState('Visão geral')

  const campaign = CAMPAIGNS.find(c => c.id === id) || CAMPAIGNS[0]
  const alerts   = ALERTS.filter(a => a.campanhaId === id)
  const tasks    = id === 'c1' ? TASKS_C1 : []

  const highCount = alerts.filter(a => a.severidade === 'HIGH').length
  const daysToLaunch = Math.ceil((new Date(campaign.lancamento) - new Date('2026-06-29')) / 86400000)

  return (
    <div style={{ padding: '32px 40px 56px', maxWidth: 960 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Link to="/" style={{ fontSize: 12, color: '#888780' }}>Dashboard</Link>
        <span style={{ color: '#D3D1C7', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: '#18181B', fontWeight: 500 }}>{campaign.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #E8E6E0' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: campaign.risco === 'HIGH' ? '#E24B4A' : campaign.risco === 'MEDIUM' ? '#EF9F27' : '#639922' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#18181B', margin: 0 }}>{campaign.name}</h1>
            {highCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FECACA', padding: '3px 9px', borderRadius: 99 }}>
                {highCount} crítico{highCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#888780', margin: 0 }}>
            Fase: <strong style={{ color: '#18181B' }}>{campaign.fase}</strong> · Lançamento: {new Date(campaign.lancamento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: daysToLaunch <= 7 ? '#E24B4A' : '#185FA5', margin: 0, lineHeight: 1 }}>
            {daysToLaunch > 0 ? `D-${daysToLaunch}` : daysToLaunch === 0 ? 'D0' : `D+${Math.abs(daysToLaunch)}`}
          </p>
          <p style={{ fontSize: 11, color: '#888780', margin: '3px 0 0' }}>dias para o lançamento</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E8E6E0', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? '#18181B' : '#888780', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === t ? '#E8472A' : 'transparent'}`, marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Visão geral' && <TabVisaoGeral campaign={campaign} alerts={alerts} tasks={tasks} />}
      {tab === 'Assets'      && <TabAssets tasks={tasks} />}
      {tab === 'Calendário'  && <TabCalendario tasks={tasks} />}
      {tab === 'Ofertas'     && <TabOfertas />}
      {tab === 'Debriefing'  && <TabDebriefing tasks={tasks} />}
    </div>
  )
}
