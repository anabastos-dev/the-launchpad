import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import MissionGantt from '../components/MissionGantt.jsx'
import { theme } from '../theme.js'

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M2 5.5L4.5 8L9 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const STATUS_RISK = {
  'em execução':       'MEDIUM',
  'em planejamento':   'OK',
  'não iniciado':      'OK',
  'em produção':       'MEDIUM',
  'kickoff':           'OK',
  'pré-lançamento':    'MEDIUM',
  'live':              'OK',
  'concluída':         'OK',
  'atrasada':          'HIGH',
  'bloqueada':         'HIGH',
}

const RISK_CFG = {
  HIGH:   { dot: theme.danger,  label: 'Critical', tagBg: theme.dangerBg,  tagColor: theme.danger },
  MEDIUM: { dot: theme.warning, label: 'At risk',  tagBg: theme.warningBg, tagColor: theme.warning },
  OK:     { dot: theme.success, label: 'On track', tagBg: theme.successBg, tagColor: theme.success },
}

function riskFromStatus(status) {
  return STATUS_RISK[(status || '').toLowerCase()] || 'OK'
}

function MetricCard({ label, value, sub, valueColor }) {
  return (
    <div style={{ background: theme.bg, padding: '18px 20px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: valueColor, margin: '0 0 4px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>{sub}</p>
    </div>
  )
}

function CampaignCard({ c, finalizing, onFinalize }) {
  const risk = riskFromStatus(c.status)
  const r    = RISK_CFG[risk] || RISK_CFG.OK
  const busy = finalizing === c.id
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '11px 14px' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = theme.borderStrong}
      onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
    >
      <Link to={`/campaigns/${c.id}`} state={{ name: c.name }}
        style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.finalized ? theme.success : r.dot, flexShrink: 0, opacity: c.finalized ? 0.5 : 1 }} />
          <p style={{ fontSize: 12.5, fontWeight: 600, color: c.finalized ? theme.textFaint : theme.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: c.finalized ? 'line-through' : 'none' }}>{c.name}</p>
        </div>
        <p style={{ fontSize: 10.5, color: theme.textFaint, margin: 0, paddingLeft: 13 }}>{c.finalized ? 'finalizada' : (c.status || 'sem status')}</p>
      </Link>
      <button
        onClick={e => onFinalize(e, c)}
        disabled={busy}
        title={c.finalized ? 'Reativar campanha' : 'Marcar como finalizada'}
        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: c.finalized ? theme.successBg : theme.bgSubtle, border: `1px solid ${c.finalized ? 'rgba(47,158,68,0.3)' : theme.border}`, borderRadius: theme.radiusSm, padding: '6px 10px', fontSize: 10, fontWeight: 600, color: c.finalized ? theme.success : theme.textMuted, cursor: busy ? 'default' : 'pointer', letterSpacing: '0.02em', opacity: busy ? 0.5 : 1, whiteSpace: 'nowrap' }}>
        <CheckIcon />
        {busy ? '…' : c.finalized ? 'Reativar' : 'Finalizar'}
      </button>
    </div>
  )
}

export default function Dashboard() {
  const [campaigns, setCampaigns]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [syncing, setSyncing]             = useState(false)
  const [showFinalized, setShowFinalized] = useState(false)
  const [finalizing, setFinalizing]       = useState(null)

  async function load() {
    try {
      const data = await api.getCampaigns()
      setCampaigns(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSync() {
    setSyncing(true)
    await load()
    setSyncing(false)
  }

  async function handleFinalize(e, c) {
    e.preventDefault()
    e.stopPropagation()
    setFinalizing(c.id)
    try {
      if (c.finalized) await api.unfinalizeCampaign(c.id)
      else             await api.finalizeCampaign(c.id)
      await load()
    } catch {}
    setFinalizing(null)
  }

  const active      = campaigns.filter(c => !c.finalized)
  const finalized    = campaigns.filter(c => c.finalized)
  const sorted      = [...active].sort((a, b) => (Number(a.due_date) || Infinity) - (Number(b.due_date) || Infinity))
  const critical   = active.filter(c => riskFromStatus(c.status) === 'HIGH').length
  const medium     = active.filter(c => riskFromStatus(c.status) === 'MEDIUM').length
  const nextLaunch = sorted.find(c => c.due_date && Number(c.due_date) >= Date.now())
  const daysToNext = nextLaunch ? Math.ceil((Number(nextLaunch.due_date) - Date.now()) / 86400000) : null
  const nextLabel  = daysToNext !== null ? (daysToNext > 0 ? `D-${daysToNext}` : daysToNext === 0 ? 'D0' : `D+${Math.abs(daysToNext)}`) : '—'
  const nextSub    = nextLaunch ? nextLaunch.name.split('—')[0].trim() : 'nenhuma'
  const today      = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '40px 44px 64px', maxWidth: 1120 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, color: theme.textFaint, margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
            {greeting()}, Ana
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: theme.text, margin: '0 0 6px', lineHeight: 1 }}>
            Mission Control
          </h1>
          <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>
            {today}&ensp;·&ensp;
            <span style={{ color: theme.accent, fontWeight: 600 }}>{active.length} active missions</span>
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: '7px 14px', fontSize: 11, fontWeight: 600, color: syncing ? theme.textFaint : theme.textMuted, cursor: syncing ? 'default' : 'pointer', letterSpacing: '0.02em' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}>
            <path d="M9.5 5.5A4 4 0 1 1 5.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <polyline points="9.5,1.5 9.5,5.5 5.5,5.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 32, border: `1px solid ${theme.border}`, borderRadius: theme.radius + 4, overflow: 'hidden', background: theme.border }}>
        <MetricCard label="Active missions"   value={loading ? '—' : active.length}    sub="campanhas em andamento"    valueColor={theme.text} />
        <MetricCard label="Risk signals"      value={loading ? '—' : critical + medium} sub={`${critical} critical · ${medium} medium`} valueColor={critical > 0 ? theme.danger : theme.success} />
        <MetricCard label="Finalizadas"       value={loading ? '—' : finalized.length} sub="campanhas concluídas"       valueColor={theme.text} />
        <MetricCard label="Next launch"       value={loading ? '—' : nextLabel}       sub={nextSub}                  valueColor={daysToNext !== null && daysToNext <= 3 ? theme.danger : theme.text} />
      </div>

      {/* Launch Timeline */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, letterSpacing: '-0.01em', margin: 0, textTransform: 'uppercase' }}>Launch Timeline</p>
          <Link to="/calendar" style={{ fontSize: 11, color: theme.textFaint, textDecoration: 'none', fontWeight: 500, letterSpacing: '0.02em' }}>Ver completo →</Link>
        </div>
        <MissionGantt compact campaigns={sorted} />
      </div>

      {/* Campaigns list */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, letterSpacing: '-0.01em', margin: '0 0 12px', textTransform: 'uppercase' }}>Active Missions</p>

        {loading && (
          <p style={{ fontSize: 12, color: theme.textMuted }}>Carregando do ClickUp…</p>
        )}

        {error && (
          <div style={{ background: theme.dangerBg, border: `1px solid rgba(224,62,62,0.25)`, borderRadius: theme.radius, padding: '12px 16px' }}>
            <p style={{ fontSize: 12, color: theme.danger, margin: 0 }}>Erro ao conectar ao backend: {error}</p>
          </div>
        )}

        {!loading && !error && active.length === 0 && (
          <p style={{ fontSize: 12, color: theme.textMuted }}>Nenhuma campanha ativa.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(c => <CampaignCard key={c.id} c={c} finalizing={finalizing} onFinalize={handleFinalize} />)}
        </div>

        {/* Finalizadas */}
        {finalized.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <button
              onClick={() => setShowFinalized(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showFinalized ? 'rotate(90deg)' : 'none' }}>
                <path d="M3 2L7 5L3 8" stroke={theme.textFaint} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, letterSpacing: '-0.01em' }}>
                Campanhas Finalizadas ({finalized.length})
              </span>
            </button>
            {showFinalized && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {finalized.map(c => <CampaignCard key={c.id} c={c} finalizing={finalizing} onFinalize={handleFinalize} />)}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
