import { CAMPAIGNS } from '../mock.js'
import MissionGantt from '../components/MissionGantt.jsx'

export default function CalendarPage() {
  return (
    <div style={{ padding: '40px 44px 64px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, color: '#A1A1AA', margin: '0 0 6px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Mission Control</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#18181B', margin: '0 0 6px', lineHeight: 1 }}>Launch Timeline</h1>
        <p style={{ fontSize: 12, color: '#A1A1AA', margin: 0 }}>Jun–Jul 2026 · {CAMPAIGNS.length} missions</p>
      </div>
      <MissionGantt />
    </div>
  )
}
