// Which campaigns are marked finalized — stored in Supabase, not the local
// filesystem: Vercel serverless functions don't share or persist disk
// across invocations, so a file-backed store silently forgot every write.
import { supabase } from './supabase.js'

export async function getFinalized() {
  const { data, error } = await supabase.from('finalized_campaigns').select('campaign_id')
  if (error) throw error
  return data.map(r => r.campaign_id)
}

export async function finalize(id) {
  const { error } = await supabase.from('finalized_campaigns').upsert({ campaign_id: id })
  if (error) throw error
}

export async function unfinalize(id) {
  const { error } = await supabase.from('finalized_campaigns').delete().eq('campaign_id', id)
  if (error) throw error
}
