const BASE = '/api'

function getToken() { return localStorage.getItem('minimal_token') }

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 401) {
    throw new Error('Não autorizado')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
  return data
}

export const api = {
  login: (user, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ user, password }) }),
  getCampaigns: () => request('/campaigns'),
  createCampaign: ({ name, start_date, due_date }) =>
    request('/campaigns', { method: 'POST', body: JSON.stringify({ name, start_date, due_date }) }),
  getCampaign: (id) => request(`/campaigns/${id}`),
  getAlerts: (id) => request(`/campaigns/${id}/alerts`),
  getTasks: (id) => request(`/campaigns/${id}/tasks`),
  getDirecionamento: (id) => request(`/campaigns/${id}/direcionamento`),
  getAssets: (id) => request(`/campaigns/${id}/assets`),
  getSubtasks: (id) => request(`/campaigns/${id}/subtasks`),
  getCalendario: (id) => request(`/campaigns/${id}/calendario`),
  getDebriefing: (id) => request(`/campaigns/${id}/debriefing`),
  getEvents: () => request('/events'),
  saveEvents: (events) => request('/events', { method: 'POST', body: JSON.stringify(events) }),
  getOfertas: (id) => request(`/campaigns/${id}/ofertas`),
  refresh: (id) => request(`/campaigns/${id}/refresh`, { method: 'POST' }),
  updateStatus: (taskId, status) =>
    request(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateDates: (taskId, { start_date, due_date }) =>
    request(`/tasks/${taskId}/dates`, { method: 'PATCH', body: JSON.stringify({ start_date, due_date }) }),
  addComment: (taskId, text) =>
    request(`/tasks/${taskId}/comment`, { method: 'POST', body: JSON.stringify({ text }) }),
  getComments: (taskId) => request(`/tasks/${taskId}/comments`),
}
