import { Router } from 'express'
import * as cache from '../cache.js'
import { broadcast } from '../sse.js'

const router = Router()

router.post('/clickup', (req, res) => {
  // Acknowledge immediately
  res.json({ ok: true })

  const event = req.body
  if (!event) return

  // Invalidate cache for the affected list
  const listId = event.task_id ? event.history_items?.[0]?.data?.list?.id : null
  if (listId) {
    cache.del(`graph:${listId}`)
    cache.del(`alerts:${listId}`)
  } else {
    cache.flush()
  }

  // Broadcast to SSE clients
  broadcast({ type: 'update', event: event.event, taskId: event.task_id })
})

export default router
