import { Router } from 'express'
import { syncEvents } from './calendar-sync.js'
import { authMiddleware } from '../auth.js'
import { canEditCalendar } from '../access.js'
import { supabase } from '../supabase.js'

const router = Router()

// Public — anyone can read
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('calendar_events').select('data')
    if (error) throw error
    res.json(data.map(row => row.data))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Protected — admin always; anyone else only if explicitly granted calendar-edit access
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && !(await canEditCalendar(req.user.email))) {
    return res.status(403).json({ error: 'Você não tem permissão para editar o calendário' })
  }
  const events = req.body
  if (!Array.isArray(events)) return res.status(400).json({ error: 'Payload deve ser um array' })
  try {
    await syncEvents(events).catch(err => console.error('calendar-sync failed:', err.message)) // strips the transient _notify flag from each event as it goes; never blocks the actual save

    // The frontend always sends the whole list — replace the table's
    // contents to match, same "overwrite" semantics the Redis blob had.
    // Upsert before delete (not the other way around): a transient network
    // failure between the two steps then leaves stale extra rows at worst,
    // never fewer events than before the call.
    if (events.length) {
      const rows = events.map(ev => ({ id: ev.id, data: ev }))
      const { error: upErr } = await supabase.from('calendar_events').upsert(rows)
      if (upErr) throw upErr
    }
    const keepIds = events.map(ev => ev.id)
    const delQuery = supabase.from('calendar_events').delete()
    const { error: delErr } = await (keepIds.length
      ? delQuery.not('id', 'in', `(${keepIds.join(',')})`)
      : delQuery.neq('id', ''))
    if (delErr) throw delErr
    res.json({ ok: true, count: events.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
