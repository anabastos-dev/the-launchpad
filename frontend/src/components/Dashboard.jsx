import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import AlertPanel from './AlertPanel.jsx'
import CampaignList from './CampaignList.jsx'

const SPACE_ID = import.meta.env.VITE_CLICKUP_SPACE_ID || ''

export default function Dashboard({ onLogout }) {
  const [campaigns, setCampaigns] = useState([])
  const [selected, setSelected] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [loadingAlerts, setLoadingAlerts] = useState(false)
  const [loadingId, setLoadingId] = useState(null)
  const [error, setError] = useState('')

  // Load campaigns list
  useEffect(() => {
    api.getCampaigns()
      .then(lists => {
        setCampaigns(lists.map(l => ({ ...l, risk: 'OK', alertCount: 0 })))
        setLoadingCampaigns(false)
        // Auto-select first
        if (lists.length > 0) handleSelect(lists[0])
      })
      .catch(err => {
        setError(err.message)
        setLoadingCampaigns(false)
      })
  }, [])

  const loadAlerts = useCallback(async (listId, force = false) => {
    setLoadingAlerts(true)
    setLoadingId(listId)
    try {
      const data = force
        ? (await api.refresh(listId)).alerts
        : await api.getAlerts(listId)

      setAlerts(data)

      // Update risk level in campaigns list
      const risk = data.some(a => a.severity === 'HIGH') ? 'HIGH'
        : data.some(a => a.severity === 'MEDIUM') ? 'MEDIUM'
        : data.some(a => a.severity === 'WARNING') ? 'WARNING'
        : 'OK'

      setCampaigns(prev =>
        prev.map(c => c.id === listId ? { ...c, risk, alertCount: data.length } : c)
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingAlerts(false)
      setLoadingId(null)
    }
  }, [])

  function handleSelect(campaign) {
    setSelected(campaign)
    setAlerts([])
    loadAlerts(campaign.id)
  }

  function handleRefresh() {
    if (selected) loadAlerts(selected.id, true)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-tight">Minimal Club</span>
          <span className="text-gray-500 text-sm">Dashboard de Campanhas</span>
        </div>
        <div className="flex items-center gap-4">
          {alerts.filter(a => a.severity === 'HIGH').length > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {alerts.filter(a => a.severity === 'HIGH').length} crítico(s)
            </span>
          )}
          <button
            onClick={onLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          {loadingCampaigns ? (
            <div className="bg-gray-800 rounded-2xl p-5 text-gray-500 text-sm">
              Carregando campanhas...
            </div>
          ) : (
            <CampaignList
              campaigns={campaigns}
              selectedId={selected?.id}
              onSelect={handleSelect}
              loadingId={loadingId}
            />
          )}
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-6">
          {error && (
            <div className="bg-red-950 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {selected ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">{selected.name}</h1>
                  {selected.folder && (
                    <p className="text-sm text-gray-400 mt-0.5">{selected.folder}</p>
                  )}
                </div>
              </div>
              <AlertPanel
                alerts={alerts}
                loading={loadingAlerts}
                onRefresh={handleRefresh}
                listId={selected.id}
              />
            </>
          ) : (
            <div className="bg-gray-800 rounded-2xl p-8 text-center text-gray-500">
              Selecione uma campanha para ver os alertas
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
