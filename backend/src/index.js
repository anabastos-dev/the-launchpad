import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import taskRoutes from './routes/tasks.js'
import webhookRoutes from './routes/webhooks.js'
import { addClient } from './sse.js'
import { authMiddleware } from './auth.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// SSE endpoint
app.get('/api/events', authMiddleware, (req, res) => {
  const remove = addClient(res)
  req.on('close', remove)
})

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/webhooks', webhookRoutes)

app.get('/api/healthcheck', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.listen(PORT, () => console.log(`Minimal Dashboard backend na porta ${PORT}`))
