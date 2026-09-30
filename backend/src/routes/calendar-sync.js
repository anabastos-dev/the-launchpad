import { Router } from 'express'
import * as clickup from '../clickup.js'
import { getMembers, resolveMemberByEmail } from '../members.js'
import { supabase } from '../supabase.js'

const router = Router()

const NOTIFY_LIST_ID = process.env.CLICKUP_CALENDAR_LIST_ID || '900702226925'

async function getCardmap() {
  const { data, error } = await supabase.from('calendar_cardmap').select('event_id, task_id, snapshot')
  if (error) throw error
  return Object.fromEntries(data.map(r => [r.event_id, { taskId: r.task_id, snapshot: r.snapshot }]))
}
async function upsertCardEntry(eventId, taskId, snapshot) {
  const { error } = await supabase.from('calendar_cardmap')
    .upsert({ event_id: eventId, task_id: taskId, snapshot, updated_at: new Date().toISOString() })
  if (error) throw error
}

async function getSubscribers() {
  const { data, error } = await supabase.from('calendar_subscribers').select('email, user_id, name')
  if (error) throw error
  return data.map(r => ({ email: r.email, userId: Number(r.user_id), name: r.name }))
}
async function addSubscriberRow(member) {
  const { error } = await supabase.from('calendar_subscribers')
    .upsert({ email: member.email.toLowerCase(), user_id: String(member.id), name: member.name })
  if (error) throw error
}

function fmtDate(ms) {
  if (!ms) return null
  return new Date(Number(ms)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })
}

function buildDescription(ev) {
  const parts = []
  if (ev.premissa) parts.push(ev.premissa)
  parts.push('---')
  parts.push(`Tipo: ${ev.type || '—'}`)
  parts.push(`Status: ${ev.status || '—'}`)
  if (ev.listLink) parts.push(`Lista equivalente no ClickUp: ${ev.listLink}`)
  if (ev.photosDriveLink) parts.push(`Fotos do shooting: ${ev.photosDriveLink}`)
  return parts.join('\n\n')
}

// -------- Subscribers --------

router.get('/subscribers', async (req, res) => {
  try {
    res.json(await getSubscribers())
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/subscribers', async (req, res) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'email obrigatório' })

    const members = await getMembers()
    const member = resolveMemberByEmail(email, members)
    if (!member) return res.status(404).json({ error: 'E-mail não encontrado no workspace do ClickUp' })

    await addSubscriberRow(member)

    // Add as watcher (not assignee) to every existing notification card
    const cardmap = await getCardmap()
    for (const entry of Object.values(cardmap)) {
      if (entry.taskId) {
        await clickup.updateTaskWatchers(entry.taskId, { add: [member.id] }).catch(() => {})
      }
    }

    res.json({ ok: true, name: member.name })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// -------- Core sync: call after events are saved --------

export async function syncEvents(events) {
  const cardmap = await getCardmap()
  const subscribers = await getSubscribers()
  const watcherIds = subscribers.map(s => s.userId)

  for (const ev of events) {
    // strip the transient manual-notify flag before anything else touches the event
    const forceNotify = ev._notify === true
    delete ev._notify

    const existing = cardmap[ev.id]

    if (!existing) {
      // New campaign — create the card, add current subscribers as watchers, announce it
      const created = await clickup.createTask(NOTIFY_LIST_ID, {
        name: ev.name,
        start_date: ev.start_date,
        due_date: ev.due_date,
        description: buildDescription(ev),
      })
      if (watcherIds.length) {
        await clickup.updateTaskWatchers(created.id, { add: watcherIds }).catch(() => {})
      }
      if (watcherIds.length) {
        await clickup.addComment(created.id, `📅 Nova campanha adicionada ao calendário: "${ev.name}" (${fmtDate(ev.start_date)} → ${fmtDate(ev.due_date)})`).catch(() => {})
      }
      await upsertCardEntry(ev.id, created.id, { name: ev.name, start_date: ev.start_date, due_date: ev.due_date, status: ev.status, premissa: ev.premissa || null, type: ev.type, listLink: ev.listLink || null, photosDriveLink: ev.photosDriveLink || null })
      continue
    }

    // Existing campaign — diff against last known snapshot
    const prev = existing.snapshot || {}
    const datesChanged = prev.start_date !== ev.start_date || prev.due_date !== ev.due_date
    const justCancelled = prev.status !== ev.status && ev.status === 'Cancelado'
    const descChanged = prev.premissa !== (ev.premissa || null) || prev.name !== ev.name
      || prev.type !== ev.type || prev.status !== ev.status || prev.listLink !== (ev.listLink || null)
      || prev.photosDriveLink !== (ev.photosDriveLink || null)

    if (!datesChanged && !descChanged && !forceNotify) continue // nothing to sync, skip API calls entirely

    const changes = []
    if (datesChanged) {
      changes.push(`🗓️ Data alterada: ${fmtDate(prev.start_date)} → ${fmtDate(prev.due_date)}  passa a ser  ${fmtDate(ev.start_date)} → ${fmtDate(ev.due_date)}`)
    }
    if (justCancelled) {
      changes.push(`❌ Campanha cancelada`)
    }

    const shouldNotify = changes.length > 0 || forceNotify
    const extraNote = forceNotify && changes.length === 0 ? ['✏️ Alteração marcada para notificação'] : []

    if (datesChanged) {
      await clickup.updateTaskDates(existing.taskId, { start_date: ev.start_date, due_date: ev.due_date }).catch(() => {})
    }
    if (descChanged) {
      await clickup.updateTaskDescription(existing.taskId, buildDescription(ev)).catch(() => {})
    }

    if (shouldNotify && watcherIds.length) {
      const text = [...changes, ...extraNote].join('\n') || 'Campanha atualizada'
      await clickup.addComment(existing.taskId, `${text}\n\n(${ev.name})`).catch(() => {})
    }

    await upsertCardEntry(ev.id, existing.taskId, { name: ev.name, start_date: ev.start_date, due_date: ev.due_date, status: ev.status, premissa: ev.premissa || null, type: ev.type, listLink: ev.listLink || null, photosDriveLink: ev.photosDriveLink || null })
  }
}

export default router
