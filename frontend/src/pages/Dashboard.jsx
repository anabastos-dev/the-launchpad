import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import MissionGantt from '../components/MissionGantt.jsx'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const STATUS_RISK = {
  'em produção':       'MEDIUM',
  'em planejamento':   'OK',
  'kickoff':           'OK',
  'pré-lançamento':    'MEDIUM',
  'live':              'OK',
  'concluída':         'OK',
  'atrasada':          'HIGH',
  'bloqueada':         'HIGH',
}

const RISK_CFG = {
  HIGH:   { dot: '#E24B4A', label: 'Critical',  tagBg: '#FEF2F2', tagColor: '#991B1B', tagBorder: '#FECACA' },
  MEDIUM: { dot: '#EF9F27', label: 'At risk',   tagBg: '#FFFBEB', tagColor: '#854F0B', tagBorder: '#FDE68A' },
  OK:     { dot: '#22C55E', label: 'On track',  tagBg: '#F0FDF4', tagColor: '#15803D', tagBorder: '#BBF7D0' },
}

function riskFromStatus(status) {
  return STATUS_RISK[(status || '').toLowerCase()] || 'OK'
}

function MetricCard({ label, value, sub, accent, valueColor }) {
  return (
    <div style={{ background: '#FFFFFF', padding: '20px 22px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.7 }} />
      <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 12px' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: valueColor, margin: '0 0 4px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      <p style={{ fontSize: 11, color: '#A1A1AA', margin: 0 }}>{sub}</p>
    </div>
  )
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [syncing, setSyncing]     = useState(false)

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

  const active     = campaigns.filter(c => !['concluída', 'closed'].includes((c.status || '').toLowerCase()))
  const critical   = campaigns.filter(c => riskFromStatus(c.status) === 'HIGH').length
  const medium     = campaigns.filter(c => riskFromStatus(c.status) === 'MEDIUM').length
  const today      = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '40px 44px 64px', maxWidth: 1120 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 11, color: '#A1A1AA', margin: '0 0 6px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            {greeting()}, Ana
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#18181B', margin: '0 0 6px', lineHeight: 1 }}>
            Mission Control
          </h1>
          <p style={{ fontSize: 12, color: '#A1A1AA', margin: 0 }}>
            {today}&ensp;·&ensp;
            <span style={{ color: '#E8472A', fontWeight: 600 }}>{active.length} active missions</span>
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #E4E4E7', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 600, color: syncing ? '#A1A1AA' : '#71717A', cursor: syncing ? 'default' : 'pointer', letterSpacing: '0.02em' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}>
            <path d="M9.5 5.5A4 4 0 1 1 5.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <polyline points="9.5,1.5 9.5,5.5 5.5,5.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 32, border: '1px solid #E4E4E7', borderRadius: 14, overflow: 'hidden' }}>
        <MetricCard label="Active missions"   value={loading ? '—' : active.length}    sub="campanhas em andamento"    accent="#E8472A"  valueColor="#18181B" />
        <MetricCard label="Risk signals"      value={loading ? '—' : critical + medium} sub={`${critical} critical · ${medium} medium`} accent="#E24B4A"  valueColor={critical > 0 ? '#E24B4A' : '#15803D'} />
        <MetricCard label="Campaigns total"   value={loading ? '—' : campaigns.length} sub="na lista ativa"            accent="#EF9F27"  valueColor="#18181B" />
        <MetricCard label="Next launch"       value="T−6"                              sub="Alfaiataria — 06/07"       accent="#E8472A"  valueColor="#E8472A" />
      </div>

      {/* Launch Timeline */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#18181B', letterSpacing: '-0.01em', margin: 0 }}>Launch Timeline</p>
          <Link to="/calendar" style={{ fontSize: 10, color: '#A1A1AA', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.02em' }}>Ver completo →</Link>
        </div>
        <MissionGantt compact />
      </div>

      {/* Campaigns list */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#18181B', letterSpacing: '-0.01em', margin: '0 0 14px' }}>Active Missions</p>

        {loading && (
          <p style={{ fontSize: 12, color: '#A1A1AA' }}>Carregando do ClickUp…</p>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ fontSize: 12, color: '#991B1B', margin: 0 }}>Erro ao conectar ao backend: {error}</p>
          </div>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <p style={{ fontSize: 12, color: '#A1A1AA' }}>Nenhuma campanha encontrada no ClickUp.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {campaigns.map(c => {
            const risk = riskFromStatus(c.status)
            const r    = RISK_CFG[risk] || RISK_CFG.OK
            return (
              <Link key={c.id} to={`/campaigns/${c.id}`} style={{ display: 'block', background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '14px 16px', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#18181B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: r.tagColor, background: r.tagBg, border: `1px solid ${r.tagBorder}`, padding: '2px 8px', borderRadius: 99, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {r.label}
                  </span>
                </div>
                <p style={{ fontSize: 10.5, color: '#A1A1AA', margin: 0 }}>{c.status || 'sem status'}</p>
              </Link>
            )
          })}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
