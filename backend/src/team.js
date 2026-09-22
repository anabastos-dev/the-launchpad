// Líder profiles (which teams they're responsible for, who their liderados
// are, and when they last saw the daily digest) — Redis-backed, same pattern
// as finalized.js and calendar-sync.js.
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'launchpad_team_profiles'

async function readAll() {
  if (!UPSTASH_URL) return {}
  const res = await fetch(`${UPSTASH_URL}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  })
  const { result } = await res.json()
  if (!result) return {}
  const parsed = JSON.parse(result)
  return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
}

async function writeAll(profiles) {
  if (!UPSTASH_URL) return
  await fetch(`${UPSTASH_URL}/set/${KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(profiles),
  })
}

function key(email) { return (email || '').toLowerCase() }

export async function getProfile(email) {
  const profiles = await readAll()
  return profiles[key(email)] || null
}

export async function saveProfile(email, { teams, liderados }) {
  const profiles = await readAll()
  profiles[key(email)] = {
    ...(profiles[key(email)] || {}),
    teams: Array.isArray(teams) ? teams : [],
    liderados: Array.isArray(liderados) ? liderados : [],
  }
  await writeAll(profiles)
  return profiles[key(email)]
}

export async function markDigestSeen(email) {
  const profiles = await readAll()
  const existing = profiles[key(email)] || { teams: [], liderados: [] }
  profiles[key(email)] = { ...existing, lastSeenDigest: new Date().toISOString().slice(0, 10) }
  await writeAll(profiles)
}
