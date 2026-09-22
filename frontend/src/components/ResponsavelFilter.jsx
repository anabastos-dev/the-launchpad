import { useState, useEffect, useRef } from 'react'

const TEAMS_KEY = 'launchpad_saved_teams'

function loadTeams() {
  try { return JSON.parse(localStorage.getItem(TEAMS_KEY) || '{}') } catch { return {} }
}
function saveTeams(teams) {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams))
}

// A líder can select themselves + their whole team at once, and save that
// selection so it's one click next time — instead of re-checking the same
// five names every visit.
export default function ResponsavelFilter({ people, selected, onChange }) {
  const [open,      setOpen]      = useState(false)
  const [search,    setSearch]    = useState('')
  const [teams,     setTeams]     = useState(loadTeams)
  const [newTeamName, setNewTeamName] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = people.filter(p => p.toLowerCase().includes(search.toLowerCase()))

  function toggle(name) {
    const next = new Set(selected)
    if (next.has(name)) next.delete(name); else next.add(name)
    onChange(next)
  }

  function applyTeam(names) {
    onChange(new Set(names.filter(n => people.includes(n))))
  }

  function handleSaveTeam() {
    if (!newTeamName.trim() || selected.size === 0) return
    const next = { ...teams, [newTeamName.trim()]: [...selected] }
    setTeams(next)
    saveTeams(next)
    setNewTeamName('')
  }

  function handleDeleteTeam(name) {
    const next = { ...teams }
    delete next[name]
    setTeams(next)
    saveTeams(next)
  }

  const label = selected.size === 0
    ? 'Todos os responsáveis'
    : selected.size === 1
      ? [...selected][0]
      : `${selected.size} responsáveis`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 500, padding: '7px 12px', borderRadius: 8,
          border: `1px solid ${selected.size > 0 ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.12)'}`,
          background: selected.size > 0 ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
          color: selected.size > 0 ? '#C4B5FD' : 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 13 }}>👤</span>
        {label}
        <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          width: 280, background: '#1C1C1F', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}>
          {/* Saved teams */}
          {Object.keys(teams).length > 0 && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>Meus times</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Object.entries(teams).map(([name, names]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => applyTeam(names)}
                      style={{ flex: 1, textAlign: 'left', fontSize: 12.5, fontWeight: 500, color: '#F4F4F5', background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 6, padding: '6px 9px', cursor: 'pointer' }}
                    >
                      {name} <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>({names.length})</span>
                    </button>
                    <button onClick={() => handleDeleteTeam(name)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13, padding: '0 4px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ padding: '10px 12px 6px' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar pessoa…"
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '7px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#F4F4F5', outline: 'none' }}
            />
          </div>

          {/* People checklist */}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '2px 6px' }}>
            {filtered.length === 0 && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '10px 8px' }}>Nada encontrado</p>
            )}
            {filtered.map(name => (
              <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#F4F4F5' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} style={{ width: 14, height: 14, accentColor: '#7C3AED' }} />
                {name}
              </label>
            ))}
          </div>

          {/* Save as team */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 6 }}>
            <input
              value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
              placeholder="Nome do time p/ salvar"
              onKeyDown={e => e.key === 'Enter' && handleSaveTeam()}
              style={{ flex: 1, fontSize: 12, padding: '6px 9px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#F4F4F5', outline: 'none' }}
            />
            <button
              onClick={handleSaveTeam}
              disabled={!newTeamName.trim() || selected.size === 0}
              style={{ fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 6, border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer', opacity: (!newTeamName.trim() || selected.size === 0) ? 0.4 : 1 }}
            >
              Salvar
            </button>
          </div>

          {selected.size > 0 && (
            <button onClick={() => onChange(new Set())} style={{ width: '100%', fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '9px 0', cursor: 'pointer' }}>
              Limpar seleção
            </button>
          )}
        </div>
      )}
    </div>
  )
}
