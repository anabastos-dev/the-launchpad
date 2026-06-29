// Field IDs discovered from GET /list/901326968297/field
// These fields are shared across all campaign lists via the space
export const FIELD_IDS = {
  responsavel:    'dcedabca-3297-4377-a51d-80834bf35915',
  aprovador:      'cc018eb3-438d-4d8e-aa66-8303b971944f',
  consultar:      '7b0de8eb-1894-4438-add4-83ed6e913b3f',
  informar:       '7c45aaaa-8612-40ee-82a7-f0a0f6e6d5ba',
  etapaLimitante: '6e55a453-d34d-4969-b1fa-a93ad43ad20f',
  leadTime:       '2d1d0721-f728-4349-93c5-8d1017576b87',
  bloqueiaQual:   '7cc3bec2-d960-4356-a562-46ecab8528c7',
  faseCampanha:   '6faac387-7019-443b-b1cd-a488249f19dd',
  canal:          'a51ae68a-e312-47e4-91d0-6b01befee407',
  dataLancamento: '0ec39ed7-5e38-4bfc-8b80-d5a5b10d7143',
}

export function getFieldValue(task, fieldId) {
  const cf = (task.custom_fields || []).find(f => f.id === fieldId)
  if (!cf) return null
  // Dropdown: resolve option name
  if (cf.type === 'drop_down') {
    if (cf.value === null || cf.value === undefined) return null
    const opt = (cf.type_config?.options || []).find(
      o => o.orderindex === cf.value || o.id === cf.value
    )
    return opt?.name ?? null
  }
  // Number
  if (cf.type === 'number') return cf.value != null ? Number(cf.value) : null
  // Date
  if (cf.type === 'date') return cf.value ? Number(cf.value) : null
  // Users (single or multiple)
  if (cf.type === 'users') {
    if (!cf.value) return []
    const arr = Array.isArray(cf.value) ? cf.value : [cf.value]
    return arr.map(u => ({ id: u.id, name: u.username || u.email, email: u.email }))
  }
  // Short text, text
  return cf.value ?? null
}

export function getPeopleField(task, fieldId) {
  const val = getFieldValue(task, fieldId)
  if (!val) return null
  if (Array.isArray(val)) return val.length > 0 ? val[0].name : null
  return val
}

export function getPeopleArrayField(task, fieldId) {
  const val = getFieldValue(task, fieldId)
  if (!val) return []
  if (Array.isArray(val)) return val.map(u => u.name)
  return [val]
}
