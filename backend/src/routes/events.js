import { Router } from 'express'
import { authMiddleware } from '../auth.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const router = Router()

// Persist to a JSON file next to this route file
const __dir = dirname(fileURLToPath(import.meta.url))
const STORE_PATH = join(__dir, '..', 'events_store.json')

function readEvents() {
  try {
    if (existsSync(STORE_PATH)) return JSON.parse(readFileSync(STORE_PATH, 'utf8'))
  } catch {}
  return []
}

function writeEvents(events) {
  writeFileSync(STORE_PATH, JSON.stringify(events), 'utf8')
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
