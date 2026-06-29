import { Link } from 'react-router-dom'
import { CAMPAIGNS, ALERTS, METRICS_DASH } from '../mock.js'
import AlertCard from '../components/AlertCard.jsx'
import Sparkline from '../components/Sparkline.jsx'
import MissionGantt from '../components/MissionGantt.jsx'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const RISK_CFG = {
  HIGH:    { dot: '#E24B4A', label: 'Critical',  tagBg: '#FEF2F2', tagColor: '#991B1B', tagBorder: '#FECACA' },
  MEDIUM:  { dot: '#EF9F27', label: 'At risk',   tagBg: '#FFFBEB', tagColor: '#854F0B', tagBorder: '#FDE68A' },
  WARNING: { dot: '#EF9F27', label: 'Warning',   tagBg: '#FFFBEB', tagColor: '#854F0B', tagBorder: '#FDE68A' },
  OK:      { dot: '#22C55E', label: 'On track',  tagBg: '#F0FDF4', tagColor: '#15803D', tagBorder: '#BBF7D0' },
}

const CARDS = (m, highAlerts, medAlerts) => [
  {
    label: 'On-time rate',
    value: `${m.tasksNoPrazo}%`,
    sub: `${m.tasksConcluidas} of ${m.totalTasks} tasks`,
    spark: m.sparkline,
    sparkColor: '#22C55E',
    valueColor: m.tasksNoPrazo >= 70 ? '#15803D' : '#854F0B',
    accent: m.tasksNoPrazo >= 70 ? '#22C55E' : '#EF9F27',
  },
  {
    label: 'Risk signals',
    value: m.alertasCriticos,
    sub: `${highAlerts.length} critical · ${medAlerts.length} medium`,
    spark: [2,1,3,2,4,3,5,3,4,2,3,2],
    sparkColor: '#E24B4A',
    valueColor: m.alertasCriticos > 0 ? '#E24B4A' : '#15803D',
    accent: '#E24B4A',
  },
  {
    label: 'Pending handoffs',
    value: m.handoffsPendentes,
    sub: 'blocking downstream teams',
    spark: [1,2,1,3,2,3,2,4,2,3,2,2],
    sparkColor: '#EF9F27',
    valueColor: m.handoffsPendentes > 0 ? '#B45309' : '#15803D',
    accent: '#EF9F27',
  },
  {
    label: 'Next launch',
    value: `T−${m.proximoLancamento.dias}`,
    sub: m.proximoLancamento.nome,
    spark: [18,17,16,15,14,13,12,11,10,9,8,7].map(x => 20 - x),
    sparkColor: '#E8472A',
    valueColor: '#E8472A',
    accent: '#E8472A',
  },
]

const highAlerts = ALERTS.filter(a => a.severidade === 'HIGH')
const medAlerts  = ALERTS.filter(a => a.severidade === 'MEDIUM')

export default function Dashboard() {
  const m = METRICS_DASH

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
            {new Date('2026-06-29').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            &ensp;·&ensp;
            <span style={{ color: '#E8472A', fontWeight: 600 }}>{m.campanhasAtivas} active missions</span>
          </p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #E4E4E7', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 600, color: '#71717A', cursor: 'pointer', letterSpacing: '0.02em' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M9.5 5.5A4 4 0 1 1 5.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <polyline points="9.5,1.5 9.5,5.5 5.5,5.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sync
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 32, border: '1px solid #E4E4E7', borderRadius: 14, overflow: 'hidden' }}>
        {CARDS(m, highAlerts, medAlerts).map((card, i) => (
          <div key={card.label} style={{ background: '#FFFFFF', padding: '20px 22px', borderRight: i < 3 ? '1px solid #E4E4E7' : 'none', position: 'relative' }}>
            {/* Top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: card.accent, opacity: 0.7 }} />
            <p style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 12px' }}>{card.label}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: card.valueColor, margin: '0 0 4px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{card.value}</p>
                <p style={{ fontSize: 11, color: '#A1A1AA', margin: 0 }}>{card.sub}</p>
              </div>
              <Sparkline data={card.spark} color={card.sparkColor} width={68} height={30} />
            </div>
          </div>
        ))}
      </div>

      {/* Launch Timeline */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#18181B', letterSpacing: '-0.01em', margin: 0 }}>Launch Timeline</p>
          <Link to="/calendar" style={{ fontSize: 10, color: '#A1A1AA', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.02em' }}>Ver completo →</Link>
        </div>
        <MissionGantt compact />
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

        {/* Left: Alerts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#18181B', letterSpacing: '-0.01em', margin: 0 }}>Risk Signals</p>
              <div style={{ display: 'flex', gap: 5 }}>
                {highAlerts.length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: 99 }}>
                    {highAlerts.length} critical
                  </span>
                )}
                {medAlerts.length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#854F0B', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 99 }}>
                    {medAlerts.length} medium
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ALERTS.filter(a => ['HIGH','MEDIUM'].includes(a.severidade)).map(a => (
              <AlertCard key={a.id} alerta={a} showCampanha />
            ))}
          </div>
        </div>

        {/* Right: Campaigns */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#18181B', letterSpacing: '-0.01em', margin: '0 0 14px' }}>Active Missions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CAMPAIGNS.map(c => {
              const r = RISK_CFG[c.risco] || RISK_CFG.OK
              const daysToLaunch = Math.ceil((new Date(c.lancamento) - new Date('2026-06-29')) / 86400000)
              const tLabel = daysToLaunch > 0 ? `T−${daysToLaunch}` : daysToLaunch === 0 ? 'LIVE' : `T+${Math.abs(daysToLaunch)}`
              return (
                <Link key={c.id} to={`/campaigns/${c.id}`} style={{ display: 'block', background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '14px 16px', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: '#18181B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#E8472A', letterSpacing: '0.04em', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{tLabel}</span>
                  </div>
                  <div style={{ background: '#F4F4F5', borderRadius: 99, height: 3, marginBottom: 10 }}>
                    <div style={{ width: `${c.progress}%`, height: '100%', borderRadius: 99, background: r.dot, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10.5, color: '#A1A1AA' }}>{c.fase}</span>
                    {c.alertCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: r.tagColor, background: r.tagBg, border: `1px solid ${r.tagBorder}`, padding: '1px 7px', borderRadius: 99 }}>
                        {c.alertCount} signal{c.alertCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
