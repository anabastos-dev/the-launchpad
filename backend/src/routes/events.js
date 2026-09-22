import { Router } from 'express'
import { syncEvents } from './calendar-sync.js'
import { authMiddleware } from '../auth.js'
import { canEditCalendar } from '../access.js'

const router = Router()

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'launchpad_calendar_events'

async function redisGet() {
  if (!UPSTASH_URL) return []
  const res = await fetch(`${UPSTASH_URL}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  })
  const { result } = await res.json()
  if (!result) return []
  const parsed = JSON.parse(result)
  // handle legacy double-encoded values
  return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
}

async function redisSet(events) {
  if (!UPSTASH_URL) return
  await fetch(`${UPSTASH_URL}/set/${KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(events),
  })
}

// Public — anyone can read
router.get('/', async (req, res) => {
  try {
    res.json(await redisGet())
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Protected — admin always; anyone else only if explicitly granted calendar-edit access
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && !(await canEditCalendar(req.user.email))) {
    return res.status(403).json({ error: 'Você não tem permissão para editar o calendário' })
  }
  const events = req.body
  if (!Array.isArray(events)) return res.status(400).json({ error: 'Payload deve ser um array' })
  try {
    await syncEvents(events).catch(err => console.error('calendar-sync failed:', err.message)) // strips the transient _notify flag from each event as it goes; never blocks the actual save
    await redisSet(events)
    res.json({ ok: true, count: events.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
