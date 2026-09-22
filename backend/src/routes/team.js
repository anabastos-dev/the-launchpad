import { Router } from 'express'
import { authMiddleware, requireAdmin } from '../auth.js'
import { getProfile, saveProfile, markDigestSeen } from '../team.js'
import { getCalendarEditors, setCalendarEdit, canEditCalendar } from '../access.js'
import { ACTIVE_CAMPAIGNS, getSubtasks } from './campaigns.js'
import { getMembers } from '../members.js'

const router = Router()
router.use(authMiddleware)

// GET /api/team/admin/access — every workspace member + whether they can edit the calendar
// (login itself is open to anyone with a company email — this only controls calendar-edit)
router.get('/admin/access', requireAdmin, async (req, res) => {
  try {
    const [members, editors] = await Promise.all([getMembers(), getCalendarEditors()])
    res.json(members
      .filter(m => m.email)
      .map(m => ({ ...m, canEditCalendar: editors.includes(m.email.toLowerCase()) }))
      .sort((a, b) => a.name.localeCompare(b.name)))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/team/admin/access — grant/revoke calendar-edit access for one member
router.post('/admin/access', requireAdmin, async (req, res) => {
  try {
    const { email, canEditCalendar } = req.body || {}
    if (!email) return res.status(400).json({ error: 'email obrigatório' })
    await setCalendarEdit(email, !!canEditCalendar)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const INACTIVE_STATUSES = new Set(['cancelada', 'cancelado', 'bloqueada', 'bloqueado', 'blocked', 'cancelled'])
function isClosed(task) {
  if ((task.statusType || '').toLowerCase() === 'closed') return true
  return INACTIVE_STATUSES.has((task.status || '').toLowerCase())
}
function todayBounds() {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end = new Date(); end.setHours(23, 59, 59, 999)
  return [start.getTime(), end.getTime()]
}

// GET /api/team/me — profile + whether onboarding/digest are pending
router.get('/me', async (req, res) => {
  try {
    const { email, name, role } = req.user
    if (role === 'admin') return res.json({ email, name, role, canEditCalendar: true, needsOnboarding: false, digestPending: false })

    const [profile, editable] = await Promise.all([getProfile(email), canEditCalendar(email)])
    const today = new Date().toISOString().slice(0, 10)
    res.json({
      email, name, role,
      canEditCalendar: editable,
      teams: profile?.teams || [],
      liderados: profile?.liderados || [],
      needsOnboarding: !profile,
      digestPending: !!profile && profile.lastSeenDigest !== today,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/team/me — save which teams/liderados a líder is responsible for
router.post('/me', async (req, res) => {
  try {
    const { teams, liderados } = req.body || {}
    const saved = await saveProfile(req.user.email, { teams, liderados })
    res.json({ ok: true, ...saved })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/team/members — workspace roster, for the liderados picker
router.get('/members', async (req, res) => {
  try {
    res.json(await getMembers())
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/team/digest — overdue/due-today tasks + progress for the líder and their liderados
router.get('/digest', async (req, res) => {
  try {
    const { name, role } = req.user
    if (role !== 'lider') return res.json({ people: [] })

    const profile = await getProfile(req.user.email)
    const names = [name, ...(profile?.liderados || [])]
    const nameSet = new Set(names.map(n => n.toLowerCase()))

    const campaigns = ACTIVE_CAMPAIGNS().filter(c => !c.finalized)
    const [todayStart, todayEnd] = todayBounds()

    const byPerson = {}
    names.forEach(n => { byPerson[n] = { name: n, overdue: [], dueToday: [], total: 0, done: 0 } })

    for (const campaign of campaigns) {
      const tasks = await getSubtasks(campaign.id).catch(() => [])
      for (const t of tasks) {
        if (!t.responsavel || !nameSet.has(t.responsavel.toLowerCase())) continue
        const bucket = byPerson[names.find(n => n.toLowerCase() === t.responsavel.toLowerCase())]
        if (!bucket) continue
        bucket.total++
        const closed = isClosed(t)
        if (closed) { bucket.done++; continue }
        const due = t.due_date ? Number(t.due_date) : null
        if (due !== null && due < todayStart) {
          bucket.overdue.push({ id: t.id, tarefa: t.name, campanha: campaign.name, due_date: t.due_date, url: t.url })
        } else if (due !== null && due <= todayEnd) {
          bucket.dueToday.push({ id: t.id, tarefa: t.name, campanha: campaign.name, url: t.url })
        }
      }
    }

    const people = Object.values(byPerson).map(p => ({
      ...p,
      pct: p.total ? Math.round((p.done / p.total) * 100) : null,
    }))

    res.json({ people })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/team/digest/seen — dismiss today's popup
router.post('/digest/seen', async (req, res) => {
  try {
    await markDigestSeen(req.user.email)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
