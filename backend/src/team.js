// Líder profiles (which teams they're responsible for, who their liderados
// are, and when they last saw the daily digest) — Supabase-backed, same
// pattern as finalized.js and calendar-sync.js.
import { supabase } from './supabase.js'

function key(email) { return (email || '').toLowerCase() }

export async function getProfile(email) {
  const { data, error } = await supabase
    .from('team_profiles')
    .select('data')
    .eq('email', key(email))
    .maybeSingle()
  if (error) throw error
  return data?.data || null
}

export async function saveProfile(email, { teams, liderados }) {
  const existing = await getProfile(email)
  const next = {
    ...(existing || {}),
    teams: Array.isArray(teams) ? teams : [],
    liderados: Array.isArray(liderados) ? liderados : [],
  }
  const { error } = await supabase.from('team_profiles').upsert({ email: key(email), data: next })
  if (error) throw error
  return next
}

export async function markDigestSeen(email) {
  const existing = await getProfile(email) || { teams: [], liderados: [] }
  const next = { ...existing, lastSeenDigest: new Date().toISOString().slice(0, 10) }
  const { error } = await supabase.from('team_profiles').upsert({ email: key(email), data: next })
  if (error) throw error
}
