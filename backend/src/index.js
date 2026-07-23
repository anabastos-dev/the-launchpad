import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import taskRoutes from './routes/tasks.js'
import webhookRoutes from './routes/webhooks.js'
import eventsRoutes from './routes/events.js'

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim())
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.some(o => origin.startsWith(o))),
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/events', eventsRoutes)

app.get('/api/healthcheck', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.listen(PORT, () => console.log(`Minimal Dashboard backend na porta ${PORT}`))

export default app
