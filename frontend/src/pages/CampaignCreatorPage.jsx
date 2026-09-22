import { useState, useRef, useEffect } from 'react'
import { api } from '../api.js'
import { theme } from '../theme.js'

const FASES = ['Kickoff', 'Estratégia', 'Produção', 'Pré-lançamento', 'Live', 'Retrospectiva']
const FASE_COLORS = {
  'Kickoff':        '#7C3AED',
  'Estratégia':     '#185FA5',
  'Produção':       theme.warning,
  'Pré-lançamento': theme.accent,
  'Live':           theme.success,
  'Retrospectiva':  theme.textMuted,
}

// Starting skeleton for every new campaign — the workstreams that show up on
// almost every launch. The agent (or Ana, by hand) fills in responsável,
// datas and adjusts grupos/tarefas from here based on the briefing, instead
// of starting from a blank page every time.
function defaultPlaybook() {
  const t = (name, fase) => ({ name, assignees: [], due_date: null, fase, el: 'Não' })
  const g = (name, fase, tarefas) => ({ name, assignees: [], due_date: null, fase, el: 'Não', tarefas })
  return [
    g('Kickoff', 'Kickoff', [
      t('Reunião de kickoff', 'Kickoff'),
      t('Alinhar briefing e cronograma com o time', 'Kickoff'),
    ]),
    g('Criativos — Vídeos', 'Produção', [
      t('Roteiro dos vídeos', 'Produção'),
      t('Gravação', 'Produção'),
      t('Edição e aprovação', 'Produção'),
    ]),
    g('Criativos — Estáticos Meta', 'Produção', [
      t('Peças estáticas Meta Ads', 'Produção'),
      t('Aprovação das peças', 'Produção'),
    ]),
    g('Criativos — Estáticos Google', 'Produção', [
      t('Peças estáticas Google Ads', 'Produção'),
      t('Aprovação das peças', 'Produção'),
    ]),
    g('Setup Meta Ads', 'Pré-lançamento', [
      t('Estrutura de campanhas', 'Pré-lançamento'),
      t('Configurar públicos e orçamento', 'Pré-lançamento'),
    ]),
    g('Setup Google Ads', 'Pré-lançamento', [
      t('Estrutura de campanhas', 'Pré-lançamento'),
      t('Configurar públicos e orçamento', 'Pré-lançamento'),
    ]),
    g('Site', 'Produção', [
      t('Página/banner da campanha', 'Produção'),
      t('QA da página', 'Pré-lançamento'),
    ]),
    g('CRM — Copy', 'Produção', [
      t('Copy dos e-mails/SMS', 'Produção'),
      t('Aprovação da copy', 'Produção'),
    ]),
    g('CRM — Disparos', 'Pré-lançamento', [
      t('Configurar disparos', 'Pré-lançamento'),
      t('Agendar envios', 'Pré-lançamento'),
    ]),
    g('Social Media', 'Pré-lançamento', [
      t('Calendário de posts', 'Pré-lançamento'),
      t('Produção dos posts', 'Pré-lançamento'),
    ]),
    g('Comercial / Lojas', 'Pré-lançamento', [
      t('Briefing para o time comercial', 'Pré-lançamento'),
    ]),
    g('B2B', 'Pré-lançamento', [
      t('Briefing para o time B2B', 'Pré-lançamento'),
    ]),
    g('Retrospectiva', 'Retrospectiva', [
      t('Debriefing de resultados', 'Retrospectiva'),
    ]),
  ]
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

// Extracts a ClickUp list ID from a pasted list/folder URL, or passes through a raw ID.
function parseListId(input) {
  const str = (input || '').trim()
  const match = str.match(/\/li\/(\d+)/) || str.match(/\/(\d{6,})\/?$/)
  return match ? match[1] : str
}

const inputBase = { border: `1px solid ${theme.border}`, borderRadius: 6, padding: '4px 7px', fontSize: 11.5, color: theme.text, background: theme.bg, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

function FaseSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputBase, width: 108, color: FASE_COLORS[value] || theme.textMuted, fontWeight: 600 }}>
      {FASES.map(f => <option key={f} value={f}>{f}</option>)}
    </select>
  )
}
function ElSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputBase, width: 52, color: value === 'Sim' ? theme.accent : theme.textFaint, fontWeight: value === 'Sim' ? 700 : 400 }}>
      <option value="Não">Não</option>
      <option value="Sim">Sim</option>
    </select>
  )
}
function ResponsavelSelect({ value, members, onChange }) {
  const known = value && !members.some(m => m.name === value)
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inputBase, width: 140, color: value ? theme.text : theme.textFaint }}>
      <option value="">responsável</option>
      {known && <option value={value}>{value}</option>}
      {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
    </select>
  )
}

// ─── Editable preview table ─────────────────────────────────────────────────
function TaskPreview({ taskList, setTaskList, onUpload, uploading, uploadResult, listId, members }) {
  const { campaign, grupos = [] } = taskList
  const total = grupos.reduce((acc, g) => acc + 1 + (g.tarefas || []).reduce((a, t) => a + 1 + (t.subtarefas || []).length, 0), 0)

  function update(path, field, value) {
    setTaskList(prev => {
      const next = structuredClone(prev)
      let target = next.grupos[path.g]
      if (path.t !== undefined) target = target.tarefas[path.t]
      if (path.s !== undefined) target = target.subtarefas[path.s]
      target[field] = value
      return next
    })
  }
  function updateResponsavel(path, name) {
    update(path, 'assignees', name ? [name] : [])
  }
  function removeRow(path) {
    setTaskList(prev => {
      const next = structuredClone(prev)
      if (path.s !== undefined) next.grupos[path.g].tarefas[path.t].subtarefas.splice(path.s, 1)
      else if (path.t !== undefined) next.grupos[path.g].tarefas.splice(path.t, 1)
      else next.grupos.splice(path.g, 1)
      return next
    })
  }
  function addGrupo() {
    setTaskList(prev => ({ ...prev, grupos: [...prev.grupos, { name: 'Novo grupo', assignees: [], due_date: null, fase: 'Produção', el: 'Não', tarefas: [] }] }))
  }
  function addTarefa(gi) {
    setTaskList(prev => {
      const next = structuredClone(prev)
      next.grupos[gi].tarefas = [...(next.grupos[gi].tarefas || []), { name: 'Nova tarefa', assignees: [], due_date: null, fase: next.grupos[gi].fase, el: 'Não' }]
      return next
    })
  }
  function addSubtarefa(gi, ti) {
    setTaskList(prev => {
      const next = structuredClone(prev)
      const t = next.grupos[gi].tarefas[ti]
      t.subtarefas = [...(t.subtarefas || []), { name: 'Nova subtarefa', assignees: [], due_date: null, fase: t.fase, el: 'Não' }]
      return next
    })
  }

  function Row({ item, path, depth, onAdd }) {
    const pad = 12 + depth * 24
    return (
      <>
        <tr style={{ borderBottom: `1px solid ${theme.border}`, background: depth === 0 ? theme.bgSubtle : theme.bg }}>
          <td style={{ padding: `7px 8px 7px ${pad}px` }}>
            <input value={item.name} onChange={e => update(path, 'name', e.target.value)}
              style={{ ...inputBase, width: '100%', fontWeight: depth === 0 ? 700 : 400 }} />
          </td>
          <td style={{ padding: '7px 6px' }}>
            <ResponsavelSelect value={(item.assignees || [])[0]} members={members} onChange={v => updateResponsavel(path, v)} />
          </td>
          <td style={{ padding: '7px 6px' }}>
            <input type="date" value={item.due_date || ''} onChange={e => update(path, 'due_date', e.target.value || null)}
              style={{ ...inputBase, width: 118 }} />
          </td>
          <td style={{ padding: '7px 6px' }}><FaseSelect value={item.fase} onChange={v => update(path, 'fase', v)} /></td>
          <td style={{ padding: '7px 6px' }}><ElSelect value={item.el} onChange={v => update(path, 'el', v)} /></td>
          <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>
            {onAdd && <button onClick={onAdd} title="Adicionar" style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: 13, fontWeight: 700, padding: '0 4px' }}>+</button>}
            <button onClick={() => removeRow(path)} title="Remover" style={{ background: 'none', border: 'none', color: theme.textFaint, cursor: 'pointer', fontSize: 13, padding: '0 4px' }}>×</button>
          </td>
        </tr>
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <p style={{ fontSize: 10, color: theme.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Pré-visualização · editável</p>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{campaign || 'Nova campanha'}</h2>
        <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>{total} itens · {grupos.length} grupos</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              {['Tarefa', 'Responsável', 'Data', 'Fase', 'EL', ''].map(h => (
                <th key={h} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 9.5, fontWeight: 700, color: theme.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', position: 'sticky', top: 0, background: theme.bgSubtle }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g, gi) => (
              <>
                <Row key={`g-${gi}`} item={g} path={{ g: gi }} depth={0} onAdd={() => addTarefa(gi)} />
                {(g.tarefas || []).map((t, ti) => (
                  <>
                    <Row key={`t-${gi}-${ti}`} item={t} path={{ g: gi, t: ti }} depth={1} onAdd={() => addSubtarefa(gi, ti)} />
                    {(t.subtarefas || []).map((s, si) => (
                      <Row key={`s-${gi}-${ti}-${si}`} item={s} path={{ g: gi, t: ti, s: si }} depth={2} />
                    ))}
                  </>
                ))}
              </>
            ))}
          </tbody>
        </table>
        <button onClick={addGrupo} style={{ margin: '10px 0 0 12px', background: 'none', border: `1px dashed ${theme.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 11.5, fontWeight: 600, color: theme.textMuted, cursor: 'pointer' }}>
          + Adicionar grupo
        </button>
      </div>

      <div style={{ padding: '14px 20px', borderTop: `1px solid ${theme.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        {uploadResult ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.success, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: theme.textMuted }}>{uploadResult.created} itens criados no ClickUp</span>
          </div>
        ) : (
          <button
            onClick={onUpload}
            disabled={uploading || !listId}
            title={!listId ? 'Cole o link da lista do ClickUp acima' : ''}
            style={{
              background: uploading || !listId ? 'rgba(232,71,42,0.35)' : theme.accent,
              color: '#fff', border: 'none', borderRadius: theme.radiusSm,
              padding: '10px 20px', fontSize: 13, fontWeight: 700,
              cursor: uploading || !listId ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em',
            }}
          >
            {uploading ? 'Subindo…' : 'Subir no ClickUp'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Message renderer ──────────────────────────────────────────────────────
function Message({ role, content }) {
  const isUser = role === 'user'
  const lines = content.split('\n')
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      <div style={{
        maxWidth: '82%', background: isUser ? theme.accent : theme.bgSubtle,
        borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
        padding: '10px 14px', color: isUser ? '#fff' : theme.text, fontSize: 13, lineHeight: 1.6,
      }}>
        {lines.map((line, i) => {
          const parts = line.split(/(\*\*[^*]+\*\*)/)
          return (
            <span key={i}>
              {parts.map((p, j) => p.startsWith('**') && p.endsWith('**')
                ? <strong key={j} style={{ color: isUser ? '#fff' : theme.text }}>{p.slice(2, -2)}</strong>
                : p)}
              {i < lines.length - 1 && <br />}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function CampaignCreatorPage() {
  const [campaignName, setCampaignName] = useState('')
  const [listLink,     setListLink]     = useState('')
  const [taskList,     setTaskList]     = useState({ campaign: '', grupos: defaultPlaybook() })
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [members,      setMembers]      = useState([])
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { setTaskList(prev => ({ ...prev, campaign: campaignName })) }, [campaignName])
  useEffect(() => { api.getTeamMembers().then(setMembers).catch(() => {}) }, [])

  const listId = parseListId(listLink)
  const sortedMembers = [...members].filter(m => m.name).sort((a, b) => a.name.localeCompare(b.name))

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55000) // backend allows up to 60s
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('minimal_token')}` },
        body: JSON.stringify({ messages: newMessages, currentTaskList: taskList }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      if (data.taskList) { setTaskList(data.taskList); setUploadResult(null) }
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'Demorou demais e eu cancelei — tenta de novo, ou manda um briefing mais curto.' : `Erro: ${err.message}`
      setMessages(prev => [...prev, { role: 'assistant', content: msg }])
    } finally {
      clearTimeout(timeout)
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function handleUpload() {
    if (!listId) { alert('Cole o link (ou ID) da lista do ClickUp.'); return }
    setUploading(true)
    try {
      const res = await fetch('/api/agent/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('minimal_token')}` },
        body: JSON.stringify({ listId, grupos: taskList.grupos }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUploadResult(data)
    } catch (err) {
      alert(`Erro ao subir: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, overflow: 'hidden' }}>

      {/* ── Chat panel ──────────────────────────────────────────── */}
      <div style={{ width: '44%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${theme.border}` }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: theme.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Campaign Creator</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 14px', letterSpacing: '-0.03em' }}>Nova campanha</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={campaignName} onChange={e => setCampaignName(e.target.value)}
              placeholder="Nome da campanha"
              style={{ border: `1px solid ${theme.border}`, borderRadius: 7, padding: '8px 10px', color: theme.text, fontSize: 13, outline: 'none', background: theme.bgSubtle, fontFamily: 'inherit' }}
            />
            <input
              value={listLink} onChange={e => setListLink(e.target.value)}
              placeholder="Link (ou ID) da lista do ClickUp"
              style={{ border: `1px solid ${theme.border}`, borderRadius: 7, padding: '8px 10px', color: theme.text, fontSize: 12, outline: 'none', background: theme.bgSubtle, fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 8px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>✦</div>
              <p style={{ color: theme.textFaint, fontSize: 13, lineHeight: 1.6 }}>
                Já carreguei um playbook padrão na prévia ao lado.<br />
                Manda o briefing da campanha — texto, resumo de PDF, o que tiver — e eu ajusto responsáveis, datas e grupos.<br />
                Você também pode editar a tabela direto, a qualquer momento.
              </p>
            </div>
          )}
          {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
              <div style={{ background: theme.bgSubtle, borderRadius: '4px 14px 14px 14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent, animation: `bounce 1s ${i * 0.15}s infinite` }} />
                  ))}
                </div>
                <span style={{ fontSize: 11.5, color: theme.textFaint }}>ajustando o playbook — pode levar até 30s</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Cole o briefing ou responda o agente…" rows={3}
              style={{ flex: 1, background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '10px 12px', color: theme.text, fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' }}
            />
            <button
              onClick={send} disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? 'rgba(232,71,42,0.3)' : theme.accent, color: '#fff', border: 'none', borderRadius: 10,
                width: 42, height: 42, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontSize: 18,
              }}
            >↑</button>
          </div>
          <p style={{ fontSize: 10, color: theme.textFaint, margin: '6px 0 0', textAlign: 'center' }}>Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      </div>

      {/* ── Preview panel ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bgSubtle, overflow: 'hidden' }}>
        <TaskPreview taskList={taskList} setTaskList={setTaskList} onUpload={handleUpload} uploading={uploading} uploadResult={uploadResult} listId={listId} members={sortedMembers} />
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-4px); opacity: 1; } }
        textarea::placeholder, input::placeholder { color: ${theme.textFaint}; }
      `}</style>
    </div>
  )
}
