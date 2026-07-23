import { Router } from 'express'
import { authMiddleware } from '../auth.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const router = Router()

// Use /tmp (writable on Vercel serverless) with in-memory fallback
const STORE_PATH = '/tmp/launchpad_events.json'
let memoryStore = []

function readEvents() {
  if (memoryStore.length > 0) return memoryStore
  try {
    if (existsSync(STORE_PATH)) {
      memoryStore = JSON.parse(readFileSync(STORE_PATH, 'utf8'))
      return memoryStore
    }
  } catch {}
  return []
}

function writeEvents(events) {
  memoryStore = events
  try { writeFileSync(STORE_PATH, JSON.stringify(events), 'utf8') } catch {}
}

// Public — anyone can read
router.get('/', (req, res) => {
  res.json(readEvents())
})

// Protected — only logged-in user (Ana) can write
router.post('/', authMiddleware, (req, res) => {
  const events = req.body
  if (!Array.isArray(events)) return res.status(400).json({ error: 'Payload deve ser um array' })
  writeEvents(events)
  res.json({ ok: true, count: events.length })
})

export default router
