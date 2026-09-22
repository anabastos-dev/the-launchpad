// Which workspace members the admin has granted líder access to — nobody
// gets in as líder just by being a ClickUp workspace member; Ana has to
// explicitly flip them on.
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'launchpad_granted_access'

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

export async function getGranted() { return readAll() }

export async function hasAccess(email) {
  const emails = await readAll()
  return emails.includes((email || '').toLowerCase())
}

export async function setAccess(email, granted) {
  const e = (email || '').toLowerCase()
  const emails = await readAll()
  const next = granted
    ? (emails.includes(e) ? emails : [...emails, e])
    : emails.filter(x => x !== e)
  await writeAll(next)
  return next
}
