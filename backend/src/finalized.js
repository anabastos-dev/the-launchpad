// Which campaigns are marked finalized — stored in Upstash Redis, not the
// local filesystem: Vercel serverless functions don't share or persist disk
// across invocations, so a file-backed store silently forgot every write.
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'launchpad_finalized_campaigns'

async function read() {
  if (!UPSTASH_URL) return []
  const res = await fetch(`${UPSTASH_URL}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  })
  const { result } = await res.json()
  if (!result) return []
  const parsed = JSON.parse(result)
  return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
}

async function write(ids) {
  if (!UPSTASH_URL) return
  await fetch(`${UPSTASH_URL}/set/${KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(ids),
  })
}

export async function getFinalized() { return read() }

export async function finalize(id) {
  const ids = await read()
  if (!ids.includes(id)) await write([...ids, id])
}

export async function unfinalize(id) {
  await write((await read()).filter(x => x !== id))
}
