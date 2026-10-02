import { useEffect, useState } from 'react'
import { theme } from './theme.js'

const NEW_URL = 'https://launchpad-150404129303.southamerica-east1.run.app/mkt'
const SECONDS = 10

export default function MovedNotice() {
  const [left, setLeft] = useState(SECONDS)

  useEffect(() => {
    if (left <= 0) { window.location.replace(NEW_URL); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: theme.bgSubtle }}>
      <div style={{ maxWidth: 460, width: '100%', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '36px 32px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.accent, margin: '0 0 10px' }}>Aviso</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: theme.text, margin: '0 0 12px' }}>O Launchpad mudou de link</h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: theme.textMuted, margin: '0 0 24px' }}>
          Esta versão foi desativada. Atualize seus favoritos e use o novo endereço daqui pra frente.
        </p>
        <a href={NEW_URL} style={{ display: 'block', textAlign: 'center', background: theme.accent, color: '#fff', fontWeight: 600, fontSize: 14, padding: '12px 16px', borderRadius: theme.radiusSm, textDecoration: 'none' }}>
          Ir para o novo Launchpad →
        </a>
        <p style={{ fontSize: 12, color: theme.textFaint, textAlign: 'center', margin: '14px 0 0' }}>
          Redirecionando automaticamente em {left}s
        </p>
      </div>
    </div>
  )
}
