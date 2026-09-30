// Who's allowed to edit the marketing calendar — everyone with a company
// email can log in as líder; this list is a separate, narrower permission
// Ana grants explicitly per person from the "Acessos" admin page.
import { supabase } from './supabase.js'

export async function getCalendarEditors() {
  const { data, error } = await supabase.from('calendar_edit_access').select('email')
  if (error) throw error
  return data.map(r => r.email)
}

export async function canEditCalendar(email) {
  const { data, error } = await supabase
    .from('calendar_edit_access')
    .select('email')
    .eq('email', (email || '').toLowerCase())
    .maybeSingle()
  if (error) throw error
  return !!data
}

export async function setCalendarEdit(email, allowed) {
  const e = (email || '').toLowerCase()
  if (allowed) {
    const { error } = await supabase.from('calendar_edit_access').upsert({ email: e })
    if (error) throw error
  } else {
    const { error } = await supabase.from('calendar_edit_access').delete().eq('email', e)
    if (error) throw error
  }
  return getCalendarEditors()
}
