import { ALERTS, CAMPAIGNS } from '../mock.js'
import AlertCard from '../components/AlertCard.jsx'

const CAMP_NAME = Object.fromEntries(CAMPAIGNS.map(c => [c.id, c.name]))

export default function AlertsPage() {
  const high   = ALERTS.filter(a => a.severidade === 'HIGH')
  const medium = ALERTS.filter(a => a.severidade === 'MEDIUM')

  return (
    <div style={{ padding: '40px 44px 64px', maxWidth: 860 }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, color: '#A1A1AA', margin: '0 0 6px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Mission Control</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#18181B', margin: '0 0 6px', lineHeight: 1 }}>Risk Signals</h1>
        <p style={{ fontSize: 12, color: '#A1A1AA', margin: 0 }}>
          <span style={{ color: '#E24B4A', fontWeight: 600 }}>{high.length} crítico{high.length !== 1 ? 's' : ''}</span>
          &ensp;·&ensp;
          <span style={{ color: '#BA7517', fontWeight: 600 }}>{medium.length} em risco</span>
          &ensp;·&ensp;{ALERTS.length} sinais no total
        </p>
      </div>

      {high.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#E24B4A', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Críticos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {high.map(a => <AlertCard key={a.id} alerta={a} showCampanha />)}
          </div>
        </section>
      )}

      {medium.length > 0 && (
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#BA7517', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Em risco</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {medium.map(a => <AlertCard key={a.id} alerta={a} showCampanha />)}
          </div>
        </section>
      )}
    </div>
  )
}
