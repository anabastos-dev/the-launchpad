import AlertCard from './AlertCard.jsx'

export default function AlertPanel({ alertas, loading, onRefresh }) {
  const highCount = alertas.filter(a => a.severidade === 'HIGH').length
  const mediumCount = alertas.filter(a => a.severidade === 'MEDIUM').length

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 16, padding: '24px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888780', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Atenção agora
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {highCount > 0 && (
                <span style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                  {highCount} crítico{highCount > 1 ? 's' : ''}
                </span>
              )}
              {mediumCount > 0 && (
                <span style={{ background: '#FAEEDA', border: '1px solid #FAC775', color: '#854F0B', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                  {mediumCount} em risco
                </span>
              )}
              {alertas.length === 0 && !loading && (
                <span style={{ color: '#639922', fontSize: 13, fontWeight: 500 }}>✓ Nenhum gargalo detectado</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onRefresh} disabled={loading} style={{
          background: 'none', border: '1px solid #E4E4E7', borderRadius: 8,
          padding: '7px 14px', fontSize: 12, color: '#888780', cursor: loading ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>↻</span>
          {loading ? 'Atualizando...' : 'Verificar agora'}
        </button>
      </div>

      {loading && alertas.length === 0 && (
        <p style={{ color: '#B4B2A9', fontSize: 14, textAlign: 'center', padding: '24px 0', margin: 0 }}>
          Carregando alertas...
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alertas.map((a, i) => (
          <AlertCard key={`${a.tipo}-${a.taskRaiz?.id || i}`} alerta={a} />
        ))}
      </div>
    </div>
  )
}
