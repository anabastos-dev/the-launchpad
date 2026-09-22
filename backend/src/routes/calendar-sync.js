import { Router } from 'express'
import * as clickup from '../clickup.js'
import { getMembers, resolveMemberByEmail } from '../members.js'

const router = Router()

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const CARDMAP_KEY     = 'launchpad_calendar_cardmap'
const SUBSCRIBERS_KEY = 'launchpad_calendar_subscribers'
const NOTIFY_LIST_ID  = process.env.CLICKUP_CALENDAR_LIST_ID || '900702226925'

async function redisGet(key, fallback) {
  if (!UPSTASH_URL) return fallback
  const res = await fetch(`${UPSTASH_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  })
  const { result } = await res.json()
  if (!result) return fallback
  const parsed = JSON.parse(result)
  return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
}

async function redisSet(key, value) {
  if (!UPSTASH_URL) return
  await fetch(`${UPSTASH_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
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
  return parts.join('\n\n')
}

// -------- Subscribers --------

router.get('/subscribers', async (req, res) => {
  try {
    res.json(await redisGet(SUBSCRIBERS_KEY, []))
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

    const subscribers = await redisGet(SUBSCRIBERS_KEY, [])
    if (!subscribers.find(s => s.userId === member.id)) {
      subscribers.push({ email: member.email, userId: member.id, name: member.name })
      await redisSet(SUBSCRIBERS_KEY, subscribers)
    }

    // Add as watcher (not assignee) to every existing notification card
    const cardmap = await redisGet(CARDMAP_KEY, {})
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

const DEFAULT_NOTIFY_FIELDS = ['start_date', 'due_date']

export async function syncEvents(events) {
  const cardmap = await redisGet(CARDMAP_KEY, {})
  const subscribers = await redisGet(SUBSCRIBERS_KEY, [])
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
      cardmap[ev.id] = {
        taskId: created.id,
        snapshot: { name: ev.name, start_date: ev.start_date, due_date: ev.due_date, status: ev.status, premissa: ev.premissa || null, type: ev.type, listLink: ev.listLink || null },
      }
      continue
    }

    // Existing campaign — diff against last known snapshot
    const prev = existing.snapshot || {}
    const datesChanged = prev.start_date !== ev.start_date || prev.due_date !== ev.due_date
    const justCancelled = prev.status !== ev.status && ev.status === 'Cancelado'
    const descChanged = prev.premissa !== (ev.premissa || null) || prev.name !== ev.name
      || prev.type !== ev.type || prev.status !== ev.status || prev.listLink !== (ev.listLink || null)

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

    cardmap[ev.id] = {
      taskId: existing.taskId,
      snapshot: { name: ev.name, start_date: ev.start_date, due_date: ev.due_date, status: ev.status, premissa: ev.premissa || null, type: ev.type, listLink: ev.listLink || null },
    }
  }

  await redisSet(CARDMAP_KEY, cardmap)
}

export default router
