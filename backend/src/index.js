import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import taskRoutes from './routes/tasks.js'
import webhookRoutes from './routes/webhooks.js'
import eventsRoutes from './routes/events.js'
import agentRoutes from './routes/agent.js'
import calendarSyncRoutes from './routes/calendar-sync.js'
import teamRoutes from './routes/team.js'

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim())
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.some(o => origin.startsWith(o))),
  credentials: true,
}))
// Raised from the 100kb default — calendar events can carry a base64 cover photo.
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/agent', agentRoutes)
app.use('/api/calendar', calendarSyncRoutes)
app.use('/api/team', teamRoutes)

app.get('/api/healthcheck', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.listen(PORT, () => console.log(`Minimal Dashboard backend na porta ${PORT}`))

// Chat calls to the Campaign Creator agent (ClickUp roster fetch + a large
// completion) can run past the default 10s function timeout — raise it.
export const config = { maxDuration: 60 }

export default app
