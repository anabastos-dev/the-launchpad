import { useState, useRef, useEffect } from 'react'
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

function fmt(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

// ─── Preview table ─────────────────────────────────────────────────────────────
function TaskPreview({ taskList, onUpload, uploading, uploadResult }) {
  const { campaign, grupos = [] } = taskList
  const total = grupos.reduce((acc, g) => acc + 1 + (g.tarefas || []).reduce((a, t) => a + 1 + (t.subtarefas || []).length, 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <p style={{ fontSize: 10, color: theme.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Pré-visualização</p>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{campaign}</h2>
        <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>{total} itens · {grupos.length} grupos</p>
      </div>

      {/* table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              {['Tarefa', 'Responsável', 'Data', 'Fase', 'EL'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left',
                  fontSize: 9.5, fontWeight: 700, color: theme.textFaint,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  position: 'sticky', top: 0, background: theme.bgSubtle,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g, gi) => (
              <>
                {/* grupo row */}
                <tr key={`g-${gi}`} style={{ borderBottom: `1px solid ${theme.border}`, background: theme.bgSubtle }}>
                  <td style={{ padding: '9px 12px', color: theme.text, fontWeight: 600 }}>
                    <span style={{ fontSize: 9, color: theme.textFaint, marginRight: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>G</span>
                    {g.name}
                  </td>
                  <td style={{ padding: '9px 12px', color: theme.textMuted }}>{(g.assignees || []).join(', ') || '—'}</td>
                  <td style={{ padding: '9px 12px', color: theme.textMuted, fontVariantNumeric: 'tabular-nums' }}>{fmt(g.due_date)}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: FASE_COLORS[g.fase] || theme.textMuted, background: `${FASE_COLORS[g.fase] || theme.textMuted}1a`, padding: '2px 7px', borderRadius: 99 }}>{g.fase || '—'}</span>
                  </td>
                  <td style={{ padding: '9px 12px', color: g.el === 'Sim' ? theme.accent : theme.textFaint, fontWeight: g.el === 'Sim' ? 700 : 400 }}>{g.el || '—'}</td>
                </tr>

                {/* tarefa rows */}
                {(g.tarefas || []).map((t, ti) => (
                  <>
                    <tr key={`t-${gi}-${ti}`} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '8px 12px 8px 24px', color: theme.text }}>
                        <span style={{ fontSize: 9, color: theme.textFaint, marginRight: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>T</span>
                        {t.name}
                      </td>
                      <td style={{ padding: '8px 12px', color: theme.textMuted }}>{(t.assignees || []).join(', ') || '—'}</td>
                      <td style={{ padding: '8px 12px', color: theme.textMuted, fontVariantNumeric: 'tabular-nums' }}>{fmt(t.due_date)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: FASE_COLORS[t.fase] || theme.textMuted, background: `${FASE_COLORS[t.fase] || theme.textMuted}1a`, padding: '2px 7px', borderRadius: 99 }}>{t.fase || '—'}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: t.el === 'Sim' ? theme.accent : theme.textFaint, fontWeight: t.el === 'Sim' ? 700 : 400 }}>{t.el || '—'}</td>
                    </tr>
                    {/* subtarefa rows */}
                    {(t.subtarefas || []).map((s, si) => (
                      <tr key={`s-${gi}-${ti}-${si}`} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '7px 12px 7px 36px', color: theme.textMuted }}>
                          <span style={{ fontSize: 9, color: theme.textFaint, marginRight: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>S</span>
                          {s.name}
                        </td>
                        <td style={{ padding: '7px 12px', color: theme.textFaint }}>{(s.assignees || []).join(', ') || '—'}</td>
                        <td style={{ padding: '7px 12px', color: theme.textFaint, fontVariantNumeric: 'tabular-nums' }}>{fmt(s.due_date)}</td>
                        <td style={{ padding: '7px 12px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: FASE_COLORS[s.fase] || theme.textMuted, background: `${FASE_COLORS[s.fase] || theme.textMuted}1a`, padding: '2px 7px', borderRadius: 99 }}>{s.fase || '—'}</span>
                        </td>
                        <td style={{ padding: '7px 12px', color: s.el === 'Sim' ? theme.accent : theme.textFaint, fontWeight: s.el === 'Sim' ? 700 : 400 }}>{s.el || '—'}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* upload footer */}
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${theme.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        {uploadResult ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.success, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: theme.textMuted }}>
              {uploadResult.created} itens criados no ClickUp
            </span>
          </div>
        ) : (
          <button
            onClick={onUpload}
            disabled={uploading}
            style={{
              background: uploading ? 'rgba(232,71,42,0.4)' : theme.accent,
              color: '#fff', border: 'none', borderRadius: theme.radiusSm,
              padding: '10px 20px', fontSize: 13, fontWeight: 700,
              cursor: uploading ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em',
            }}
          >
            {uploading ? 'Subindo…' : 'Subir no ClickUp'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Message renderer ──────────────────────────────────────────────────────────
function Message({ role, content }) {
  const isUser = role === 'user'
  const lines = content.split('\n')
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 14,
    }}>
      <div style={{
        maxWidth: '82%',
        background: isUser ? theme.accent : theme.bgSubtle,
        borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
        padding: '10px 14px',
        color: isUser ? '#fff' : theme.text,
        fontSize: 13, lineHeight: 1.6,
      }}>
        {lines.map((line, i) => {
          // bold **text**
          const parts = line.split(/(\*\*[^*]+\*\*)/)
          return (
            <span key={i}>
              {parts.map((p, j) =>
                p.startsWith('**') && p.endsWith('**')
                  ? <strong key={j} style={{ color: isUser ? '#fff' : theme.text }}>{p.slice(2, -2)}</strong>
                  : p
              )}
              {i < lines.length - 1 && <br />}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const [messages, setMessages]       = useState([])
  const [input, setInput]             = useState('')
  const [listId, setListId]           = useState('')
  const [loading, setLoading]         = useState(false)
  const [taskList, setTaskList]       = useState(null)
  const [uploading, setUploading]     = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('minimal_token')}` },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      if (data.taskList) {
        setTaskList(data.taskList)
        setUploadResult(null)
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${err.message}` }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function handleUpload() {
    if (!listId.trim()) {
      alert('Cole o List ID do ClickUp antes de subir.')
      return
    }
    setUploading(true)
    try {
      const res = await fetch('/api/agent/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('minimal_token')}` },
        body: JSON.stringify({ listId: listId.trim(), grupos: taskList.grupos }),
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

  const hasPreview = !!taskList

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, overflow: 'hidden' }}>

      {/* ── Chat panel ──────────────────────────────────────────── */}
      <div style={{
        width: hasPreview ? '46%' : '100%',
        display: 'flex', flexDirection: 'column',
        borderRight: hasPreview ? `1px solid ${theme.border}` : 'none',
        transition: 'width 0.25s',
      }}>
        {/* header */}
        <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: theme.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Task Agent</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 14px', letterSpacing: '-0.03em' }}>Planejamento de Campanha</h1>
          {/* list ID input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: theme.textFaint, flexShrink: 0 }}>ClickUp List ID</span>
            <input
              value={listId}
              onChange={e => setListId(e.target.value)}
              placeholder="901328182688"
              style={{
                flex: 1, background: theme.bgSubtle, border: `1px solid ${theme.border}`,
                borderRadius: 7, padding: '6px 10px', color: theme.text, fontSize: 12,
                outline: 'none', fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        {/* messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 8px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
              <p style={{ color: theme.textFaint, fontSize: 13, lineHeight: 1.6 }}>
                Descreva a campanha — workstreams, responsáveis, datas, lançamento.<br />
                O agente monta a planilha e sobe no ClickUp.
              </p>
            </div>
          )}
          {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
              <div style={{ background: theme.bgSubtle, borderRadius: '4px 14px 14px 14px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: '50%', background: theme.accent,
                      animation: `bounce 1s ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Descreva a campanha ou responda o agente…"
              rows={3}
              style={{
                flex: 1, background: theme.bgSubtle,
                border: `1px solid ${theme.border}`, borderRadius: 10,
                padding: '10px 12px', color: theme.text, fontSize: 13,
                resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit',
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? 'rgba(232,71,42,0.3)' : theme.accent,
                color: '#fff', border: 'none', borderRadius: 10,
                width: 42, height: 42, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: 18,
              }}
            >↑</button>
          </div>
          <p style={{ fontSize: 10, color: theme.textFaint, margin: '6px 0 0', textAlign: 'center' }}>
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>

      {/* ── Preview panel ────────────────────────────────────────── */}
      {hasPreview && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bgSubtle, overflow: 'hidden' }}>
          <TaskPreview
            taskList={taskList}
            onUpload={handleUpload}
            uploading={uploading}
            uploadResult={uploadResult}
          />
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        textarea::placeholder { color: ${theme.textFaint}; }
        input::placeholder { color: ${theme.textFaint}; }
      `}</style>
    </div>
  )
}
