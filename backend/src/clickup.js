import axios from 'axios'

const BASE = 'https://api.clickup.com/api/v2'

function headers() {
  return { Authorization: process.env.CLICKUP_API_TOKEN }
}

export async function getTasks(listId, opts = {}) {
  const allTasks = []
  let page = 0
  while (true) {
    const { data } = await axios.get(`${BASE}/list/${listId}/task`, {
      headers: headers(),
      params: {
        page,
        subtasks: true,
        include_closed: opts.include_closed !== false,
        ...opts.params,
      },
    })
    allTasks.push(...(data.tasks || []))
    if (data.last_page) break
    page++
  }
  return allTasks
}

export async function getTask(taskId) {
  const { data } = await axios.get(`${BASE}/task/${taskId}`, { headers: headers() })
  return data
}

export async function getDependencies(taskId) {
  try {
    const { data } = await axios.get(`${BASE}/task/${taskId}/dependency`, { headers: headers() })
    return data.dependencies || []
  } catch {
    return []
  }
}

export async function getListFields(listId) {
  const { data } = await axios.get(`${BASE}/list/${listId}/field`, { headers: headers() })
  return data.fields || []
}

export async function getLists(folderId) {
  const { data } = await axios.get(`${BASE}/folder/${folderId}/list`, {
    headers: headers(),
    params: { archived: false },
  })
  const templateId = process.env.CLICKUP_TEMPLATE_LIST_ID
  return (data.lists || []).filter(l => l.id !== templateId)
}

export async function updateTaskStatus(taskId, statusName) {
  const { data } = await axios.put(`${BASE}/task/${taskId}`, {
    status: statusName,
  }, { headers: headers() })
  return data
}

export async function createCampaignTask(listId, { name, start_date, due_date }) {
  const body = { name }
  if (start_date) body.start_date = start_date
  if (due_date)   body.due_date   = due_date
  const { data } = await axios.post(`${BASE}/list/${listId}/task`, body, { headers: headers() })
  return data
}

export async function updateTaskDates(taskId, { start_date, due_date }) {
  const body = {}
  if (start_date !== undefined) body.start_date = start_date
  if (due_date  !== undefined) body.due_date  = due_date
  const { data } = await axios.put(`${BASE}/task/${taskId}`, body, { headers: headers() })
  return data
}

export async function updateTaskField(taskId, fieldId, value) {
  const { data } = await axios.post(`${BASE}/task/${taskId}/field/${fieldId}`, {
    value,
  }, { headers: headers() })
  return data
}

export async function addComment(taskId, commentText, assignee = null) {
  const body = { comment_text: commentText }
  if (assignee) body.assignee = assignee
  const { data } = await axios.post(`${BASE}/task/${taskId}/comment`, body, { headers: headers() })
  return data
}

export async function getComments(taskId) {
  const { data } = await axios.get(`${BASE}/task/${taskId}/comment`, { headers: headers() })
  return data.comments || []
}

export async function getAttachments(taskId) {
  // ClickUp doesn't have a direct attachments endpoint — they come in task data
  const task = await getTask(taskId)
  return task.attachments || []
}

export async function getListDetails(listId) {
  const { data } = await axios.get(`${BASE}/list/${listId}`, { headers: headers() })
  return data
}

// Get all tasks in a list that are top-level campaign tasks (no parent)
export async function getCampaignTasks(listId) {
  const { data } = await axios.get(`${BASE}/list/${listId}/task`, {
    headers: headers(),
    params: { include_closed: true, subtasks: false },
  })
  return data.tasks || []
}

// Get subtasks of a campaign task (the actual execution tasks with RACI)
export async function getSubtasks(parentTaskId, listId) {
  const allTasks = []
  let page = 0
  while (true) {
    const { data } = await axios.get(`${BASE}/list/${listId}/task`, {
      headers: headers(),
      params: {
        page,
        parent: parentTaskId,
        subtasks: true,
        include_closed: true,
      },
    })
    allTasks.push(...(data.tasks || []))
    if (data.last_page) break
    page++
  }
  return allTasks
}
