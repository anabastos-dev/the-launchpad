import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import MissionGantt from '../components/MissionGantt.jsx'

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
  HIGH:   { dot: '#F87171', label: 'Critical',  tagBg: 'rgba(248,113,113,0.12)', tagColor: '#F87171', tagBorder: 'rgba(248,113,113,0.25)' },
  MEDIUM: { dot: '#FBBF24', label: 'At risk',   tagBg: 'rgba(251,191,36,0.12)',  tagColor: '#FBBF24', tagBorder: 'rgba(251,191,36,0.25)' },
  OK:     { dot: '#4ADE80', label: 'On track',  tagBg: 'rgba(74,222,128,0.10)',  tagColor: '#4ADE80', tagBorder: 'rgba(74,222,128,0.22)' },
}

function riskFromStatus(status) {
  return STATUS_RISK[(status || '').toLowerCase()] || 'OK'
}

function MetricCard({ label, value, sub, accent, valueColor }) {
  return (
    <div style={{ background: '#18181B', padding: '20px 22px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.8 }} />
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 12px' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: valueColor, margin: '0 0 4px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{sub}</p>
    </div>
  )
}

function CampaignCard({ c, finalizing, onFinalize }) {
  const risk = riskFromStatus(c.status)
  const r    = RISK_CFG[risk] || RISK_CFG.OK
  const busy = finalizing === c.id
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: c.finalized ? 'rgba(24,24,27,0.5)' : '#18181B', border: `1px solid ${c.finalized ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '12px 14px', transition: 'border-color 0.12s' }}>
      <Link to={`/campaigns/${c.id}`} state={{ name: c.name }}
        style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.finalized ? '#4ADE80' : r.dot, flexShrink: 0, opacity: c.finalized ? 0.5 : 1 }} />
          <p style={{ fontSize: 12.5, fontWeight: 600, color: c.finalized ? 'rgba(255,255,255,0.35)' : '#F4F4F5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: c.finalized ? 'line-through' : 'none' }}>{c.name}</p>
        </div>
        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)', margin: 0, paddingLeft: 13 }}>{c.finalized ? 'finalizada' : (c.status || 'sem status')}</p>
      </Link>
      <button
        onClick={e => onFinalize(e, c)}
        disabled={busy}
        title={c.finalized ? 'Reativar campanha' : 'Marcar como finalizada'}
        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: c.finalized ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${c.finalized ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.09)'}`, borderRadius: 7, padding: '6px 10px', fontSize: 10, fontWeight: 600, color: c.finalized ? '#4ADE80' : 'rgba(255,255,255,0.3)', cursor: busy ? 'default' : 'pointer', letterSpacing: '0.02em', opacity: busy ? 0.5 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
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
  const finalized   = campaigns.filter(c => c.finalized)
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
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
            {greeting()}, Ana
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#F4F4F5', margin: '0 0 6px', lineHeight: 1 }}>
            Mission Control
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {today}&ensp;·&ensp;
            <span style={{ color: '#E8472A', fontWeight: 600 }}>{active.length} active missions</span>
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 600, color: syncing ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.45)', cursor: syncing ? 'default' : 'pointer', letterSpacing: '0.02em' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}>
            <path d="M9.5 5.5A4 4 0 1 1 5.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <polyline points="9.5,1.5 9.5,5.5 5.5,5.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 32, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
        <MetricCard label="Active missions"   value={loading ? '—' : active.length}    sub="campanhas em andamento"    accent="#E8472A"  valueColor="#F4F4F5" />
        <MetricCard label="Risk signals"      value={loading ? '—' : critical + medium} sub={`${critical} critical · ${medium} medium`} accent="#F87171"  valueColor={critical > 0 ? '#F87171' : '#4ADE80'} />
        <MetricCard label="Finalizadas"       value={loading ? '—' : finalized.length} sub="campanhas concluídas"       accent="#4ADE80"  valueColor="#F4F4F5" />
        <MetricCard label="Next launch"       value={loading ? '—' : nextLabel}       sub={nextSub}                  accent="#E8472A"  valueColor={daysToNext !== null && daysToNext <= 3 ? '#F87171' : '#F4F4F5'} />
      </div>

      {/* Launch Timeline */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.01em', margin: 0 }}>Launch Timeline</p>
          <Link to="/calendar" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.02em' }}>Ver completo →</Link>
        </div>
        <MissionGantt compact campaigns={sorted} />
      </div>

      {/* Campaigns list */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.01em', margin: '0 0 14px' }}>Active Missions</p>

        {loading && (
          <p style={{ fontSize: 12, color: '#A1A1AA' }}>Carregando do ClickUp…</p>
        )}

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ fontSize: 12, color: '#F87171', margin: 0 }}>Erro ao conectar ao backend: {error}</p>
          </div>
        )}

        {!loading && !error && active.length === 0 && (
          <p style={{ fontSize: 12, color: '#A1A1AA' }}>Nenhuma campanha ativa.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(c => <CampaignCard key={c.id} c={c} finalizing={finalizing} onFinalize={handleFinalize} />)}
        </div>

        {/* Finalizadas */}
        {finalized.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <button
              onClick={() => setShowFinalized(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 14 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showFinalized ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M3 2L7 5L3 8" stroke="rgba(255,255,255,0.35)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.01em' }}>
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
