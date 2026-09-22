import * as clickup from './clickup.js'

const TEAM_ID = process.env.CLICKUP_TEAM_ID || '31012836'

// Cache de membros do workspace
let membersCache = null
export async function getMembers() {
  if (membersCache) return membersCache
  const raw = await clickup.getWorkspaceMembers(TEAM_ID)
  membersCache = raw.map(m => ({
    id:    m.user?.id   || m.id,
    name:  m.user?.username || m.username || '',
    email: m.user?.email    || m.email    || '',
  }))
  return membersCache
}

export function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function dedup(s) { return s.replace(/(.)\1+/g, '$1') }

export function resolveMemberId(name, members) {
  if (!name) return null
  const needle = normalize(name)
  const active = members.filter(m => m.name)

  // 1. exact normalized match
  const exact = active.find(m => normalize(m.name) === needle)
  if (exact) return exact.id

  // 2. member full name is substring of needle
  const sub = active.find(m => needle.includes(normalize(m.name)))
  if (sub) return sub.id

  // 3. needle is substring of member name
  const rev = active.find(m => normalize(m.name).includes(needle))
  if (rev) return rev.id

  const needleParts = needle.split(/\s+/)
  const needleLast  = needleParts[needleParts.length - 1]
  const needleFirst = needleParts[0]

  // 4. last-name unique match (also require first name to appear, avoids "Bárbara Dias" → "Jonathan Dias")
  if (needleLast && needleLast.length > 2) {
    const lastMatches = active.filter(m => {
      const mn = normalize(m.name)
      const parts = mn.split(/\s+/)
      if (parts[parts.length - 1] !== needleLast) return false
      if (needleParts.length > 1 && needleFirst && needleFirst.length > 2) {
        return mn.includes(needleFirst)
      }
      return true
    })
    if (lastMatches.length === 1) return lastMatches[0].id
  }

  // 5. all needle words appear in member name
  const allWords = active.filter(m => {
    const mn = normalize(m.name)
    return needleParts.every(w => mn.includes(w))
  })
  if (allWords.length === 1) return allWords[0].id

  // 6. email prefix match — "barbara dias" → "barbara.dias" matches barbara.dias@...
  //    also tolerates doubled consonants: "andre.filizola" matches "andre.filizzola"
  const emailPrefix = needle.replace(/\s+/g, '.')
  const emailMatch = active.find(m => {
    const ep = (m.email || '').toLowerCase().split('@')[0]
    return ep === emailPrefix || dedup(ep) === emailPrefix
  })
  if (emailMatch) return emailMatch.id

  return null
}

// Resolve a member directly by exact email (case-insensitive) — used for
// self-serve flows (e.g. the calendar notification opt-in) where we have a
// real email address rather than a typed name.
export function resolveMemberByEmail(email, members) {
  if (!email) return null
  const needle = email.trim().toLowerCase()
  const match = members.find(m => (m.email || '').toLowerCase() === needle)
  return match || null
}
