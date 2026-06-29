const RISK_CONFIG = {
  HIGH:    { dot: 'bg-red-500',    label: 'Crítico' },
  MEDIUM:  { dot: 'bg-yellow-400', label: 'Em risco' },
  WARNING: { dot: 'bg-orange-400', label: 'Atenção' },
  OK:      { dot: 'bg-green-500',  label: 'OK' },
  ERROR:   { dot: 'bg-gray-500',   label: 'Erro' },
}

export default function CampaignList({ campaigns, selectedId, onSelect, loadingId }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5">
      <h2 className="text-lg font-bold text-white mb-4">Campanhas</h2>
      {campaigns.length === 0 && (
        <p className="text-gray-500 text-sm">Nenhuma campanha encontrada</p>
      )}
      <ul className="space-y-2">
        {campaigns.map(c => {
          const risk = RISK_CONFIG[c.risk] || RISK_CONFIG.OK
          const isSelected = c.id === selectedId
          const isLoading = c.id === loadingId
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition
                  ${isSelected ? 'bg-indigo-700 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${risk.dot}`} />
                <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                {c.folder && (
                  <span className="text-xs text-gray-500 truncate max-w-[80px]">{c.folder}</span>
                )}
                {isLoading ? (
                  <span className="text-xs text-gray-500">...</span>
                ) : (
                  c.alertCount > 0 && (
                    <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">
                      {c.alertCount}
                    </span>
                  )
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
