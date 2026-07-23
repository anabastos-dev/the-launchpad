import { Router } from 'express'
import { authMiddleware } from '../auth.js'

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
  return result ? JSON.parse(result) : []
}

async function redisSet(events) {
  if (!UPSTASH_URL) return
  await fetch(`${UPSTASH_URL}/set/${KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(events)),
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

// Protected — only logged-in user (Ana) can write
router.post('/', authMiddleware, async (req, res) => {
  const events = req.body
  if (!Array.isArray(events)) return res.status(400).json({ error: 'Payload deve ser um array' })
  try {
    await redisSet(events)
    res.json({ ok: true, count: events.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
