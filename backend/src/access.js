// Who's allowed to edit the marketing calendar — everyone with a company
// email can log in as líder; this list is a separate, narrower permission
// Ana grants explicitly per person from the "Acessos" admin page.
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'launchpad_calendar_edit_access'

async function readAll() {
  if (!UPSTASH_URL) return []
  const res = await fetch(`${UPSTASH_URL}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  })
  const { result } = await res.json()
  if (!result) return []
  const parsed = JSON.parse(result)
  return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
}

async function writeAll(emails) {
  if (!UPSTASH_URL) return
  await fetch(`${UPSTASH_URL}/set/${KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(emails),
  })
}

export async function getCalendarEditors() { return readAll() }

export async function canEditCalendar(email) {
  const emails = await readAll()
  return emails.includes((email || '').toLowerCase())
}

export async function setCalendarEdit(email, allowed) {
  const e = (email || '').toLowerCase()
  const emails = await readAll()
  const next = allowed
    ? (emails.includes(e) ? emails : [...emails, e])
    : emails.filter(x => x !== e)
  await writeAll(next)
  return next
}
