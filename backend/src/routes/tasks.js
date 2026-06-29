import { Router } from 'express'
import { authMiddleware } from '../auth.js'
import * as clickup from '../clickup.js'
import * as cache from '../cache.js'

const router = Router()
router.use(authMiddleware)

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const task = await clickup.updateTaskStatus(req.params.id, status)
    cache.flush()
    res.json(task)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/fields', async (req, res) => {
  try {
    const { fieldId, value } = req.body
    const result = await clickup.updateTaskField(req.params.id, fieldId, value)
    cache.flush()
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/comment', async (req, res) => {
  try {
    const { text } = req.body
    const result = await clickup.addComment(req.params.id, text)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/comments', async (req, res) => {
  try {
    res.json(await clickup.getComments(req.params.id))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
