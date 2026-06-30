import { Router } from 'express'
import * as cache from '../cache.js'

const router = Router()

router.post('/clickup', (req, res) => {
  res.json({ ok: true })
  const event = req.body
  if (!event) return
  const listId = event.task_id ? event.history_items?.[0]?.data?.list?.id : null
  if (listId) {
    cache.del(`graph:${listId}`)
    cache.del(`alerts:${listId}`)
  } else {
    cache.flush()
  }
})

export default router
