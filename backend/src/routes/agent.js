import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import * as clickup from '../clickup.js'
import { getMembers, resolveMemberId } from '../members.js'
import { authMiddleware } from '../auth.js'

const router = Router()
router.use(authMiddleware) // every route here mutates ClickUp or is internal tooling — never public
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FASE_FIELD = 'b16eadf9-ee56-4761-8ed1-929b1f28235a'
const EL_FIELD   = '69a14be9-6e97-4178-a0ac-03cfc350ef61'

const FASE_IDS = {
  'Kickoff':        '3ae35628-8479-42c9-8a49-e671b4d0f239',
  'Estratégia':     'c7c31a5a-2f8a-4de9-8f3b-564aa3ab6b5b',
  'Produção':       'bf6f9fbb-6fb8-4e80-a675-fee39be40dc8',
  'Pré-lançamento': '26e26426-042c-4877-885d-678d72cea7da',
  'Live':           'ff5bdb52-d6aa-48ab-812d-6df66d4e5204',
  'Retrospectiva':  '2b4f7aaa-b013-47d7-9d38-1f4ed3f151a0',
}
const EL_IDS = {
  'Sim': 'd5f995e8-514e-4350-97cd-0768011f768c',
  'Não': 'be8d60ff-3557-465e-a71c-3c3b936d648b',
}

function buildSystemPrompt(members, currentTaskList) {
  const teamNames = members.map(m => m.name).filter(Boolean).join(', ')
  const playbookNote = currentTaskList
    ? `\n\n**Playbook já carregado na tela (rascunho atual — edite-o com base no briefing, não recomece do zero a menos que a Ana peça):**\n${JSON.stringify(currentTaskList)}\n`
    : ''
  return `Você é o agente de planejamento de campanhas da Minimal Club ("Campaign Creator").
Sua função é conversar com Ana (ou um líder autorizado) e, a partir de um playbook padrão já pré-carregado, ajustar a lista de tarefas e subtarefas com base no briefing da campanha, até ficar pronta para subir no ClickUp.

**Time disponível (workspace real do ClickUp — não invente ninguém fora desta lista):**
${teamNames}
${playbookNote}
**Campos obrigatórios em TODA tarefa e subtarefa:**
- responsável (assignees): lista com ao menos um membro do time
- data (due_date): data de entrega no formato YYYY-MM-DD (null apenas se explicitamente "sem prazo")
- etapa limitante (el): "Sim" ou "Não" — pergunta se essa tarefa bloqueia outra
- fase da campanha (fase): uma das opções: Kickoff, Estratégia, Produção, Pré-lançamento, Live, Retrospectiva

**Seu processo:**
1. Parta do playbook já carregado (se houver) — não peça de novo o que já está preenchido nele
2. Ouça o briefing da campanha (texto, PDF resumido, etc.)
3. Ajuste nomes, datas, responsáveis e adicione/remova grupos e tarefas conforme o briefing pedir
4. Faça perguntas objetivas só para o que ficou faltando ou ambíguo
5. Quando o rascunho estiver bom, gere o bloco final — a Ana também pode editar a tabela manualmente antes de subir, então não precisa esperar aprovação verbal explícita para gerar o bloco, gere sempre que atualizar o playbook

**Regras:**
- Grupos (macros) também precisam de responsável, data, fase e EL
- Subtarefas herdam a fase do pai se não especificado
- Não invente responsáveis — use apenas o time listado acima
- Pergunte o que falta, não assuma
- Sempre devolva a lista COMPLETA atualizada no bloco final, não só o que mudou

**Sempre que ajustar o playbook, gere o bloco abaixo (e nada mais na mesma mensagem após ele):**

<TASK_LIST>
{
  "campaign": "Nome da campanha",
  "grupos": [
    {
      "name": "Nome do grupo",
      "assignees": ["Nome Completo"],
      "due_date": "YYYY-MM-DD",
      "fase": "Kickoff",
      "el": "Não",
      "tarefas": [
        {
          "name": "Nome da tarefa",
          "assignees": ["Nome Completo"],
          "due_date": "YYYY-MM-DD",
          "fase": "Kickoff",
          "el": "Sim",
          "subtarefas": [
            {
              "name": "Nome da subtarefa",
              "assignees": ["Nome Completo"],
              "due_date": "YYYY-MM-DD",
              "fase": "Produção",
              "el": "Não"
            }
          ]
        }
      ]
    }
  ]
}
</TASK_LIST>

Responda sempre em português do Brasil. Seja direto e objetivo.`
}

// POST /api/agent/chat
router.post('/chat', async (req, res) => {
  try {
    const { messages = [], currentTaskList = null } = req.body
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'ANTHROPIC_API_KEY não configurada no backend' })
    }
    const members = await getMembers()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 8192, // the model is asked to return the whole playbook every turn — 4096 risked truncating it
      system: buildSystemPrompt(members, currentTaskList),
      messages,
    })
    const text = response.content?.[0]?.text || ''
    const taskListMatch = text.match(/<TASK_LIST>([\s\S]*?)<\/TASK_LIST>/)
    let taskList = null
    let displayText = text
    if (taskListMatch) {
      try {
        taskList = JSON.parse(taskListMatch[1].trim())
        displayText = text.replace(/<TASK_LIST>[\s\S]*?<\/TASK_LIST>/, '').trim()
        if (!displayText) displayText = 'Planilha gerada! Revise à direita e clique em **Subir no ClickUp** quando estiver pronta.'
      } catch { /* mantém o texto original se o JSON for inválido */ }
    }
    res.json({ message: displayText, taskList })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/agent/upload
router.post('/upload', async (req, res) => {
  try {
    const { listId, grupos = [] } = req.body
    if (!listId) return res.status(400).json({ error: 'listId obrigatório' })

    const members = await getMembers()
    let created = 0

    async function resolveAssignees(names = []) {
      return names.map(n => resolveMemberId(n, members)).filter(Boolean)
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms))

    async function patchFields(taskId, fase, el) {
      const faseId = FASE_IDS[fase]
      const elId   = EL_IDS[el]
      if (faseId) await clickup.updateTaskField(taskId, FASE_FIELD, faseId).catch(() => {})
      if (elId)   await clickup.updateTaskField(taskId, EL_FIELD,   elId).catch(() => {})
    }

    function toMs(dateStr) {
      if (!dateStr) return undefined
      return new Date(dateStr + 'T12:00:00').getTime()
    }

    for (const grupo of grupos) {
      const gAssignees = await resolveAssignees(grupo.assignees)
      const gTask = await clickup.createTask(listId, {
        name:       grupo.name,
        assignees:  gAssignees,
        start_date: toMs(grupo.start_date),
        due_date:   toMs(grupo.due_date),
      })
      await patchFields(gTask.id, grupo.fase, grupo.el)
      created++
      await sleep(300)

      for (const tarefa of (grupo.tarefas || [])) {
        const tAssignees = await resolveAssignees(tarefa.assignees)
        const tTask = await clickup.createTask(listId, {
          name:       tarefa.name,
          assignees:  tAssignees,
          start_date: toMs(tarefa.start_date),
          due_date:   toMs(tarefa.due_date),
          parent:     gTask.id,
        })
        await patchFields(tTask.id, tarefa.fase, tarefa.el)
        created++
        await sleep(300)

        for (const sub of (tarefa.subtarefas || [])) {
          const sAssignees = await resolveAssignees(sub.assignees)
          const sTask = await clickup.createTask(listId, {
            name:       sub.name,
            assignees:  sAssignees,
            start_date: toMs(sub.start_date),
            due_date:   toMs(sub.due_date),
            parent:     tTask.id,
          })
          await patchFields(sTask.id, sub.fase, sub.el)
          created++
          await sleep(300)
        }
      }
    }

    res.json({ ok: true, created })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/agent/upload-campaign — cria lista no ClickUp e sobe todas as tarefas
router.post('/upload-campaign', async (req, res) => {
  try {
    const { campaignName, grupos = [] } = req.body
    if (!campaignName) return res.status(400).json({ error: 'campaignName obrigatório' })

    const folderId = process.env.CLICKUP_FOLDER_ID
    if (!folderId) return res.status(500).json({ error: 'CLICKUP_FOLDER_ID não configurado' })

    const list = await clickup.createList(folderId, campaignName)
    const listId = list.id

    const members = await getMembers()
    let created = 0

    async function resolveAssignees(names = []) {
      return names.map(n => resolveMemberId(n, members)).filter(Boolean)
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms))

    async function patchFields(taskId, fase, el) {
      const faseId = FASE_IDS[fase]
      const elId   = EL_IDS[el]
      if (faseId) await clickup.updateTaskField(taskId, FASE_FIELD, faseId).catch(() => {})
      if (elId)   await clickup.updateTaskField(taskId, EL_FIELD,   elId).catch(() => {})
    }

    function toMs(dateStr) {
      if (!dateStr) return undefined
      return new Date(dateStr + 'T12:00:00').getTime()
    }

    for (const grupo of grupos) {
      const gAssignees = await resolveAssignees(grupo.assignees)
      const gTask = await clickup.createTask(listId, {
        name:       grupo.name,
        assignees:  gAssignees,
        start_date: toMs(grupo.start_date),
        due_date:   toMs(grupo.due_date),
      })
      await patchFields(gTask.id, grupo.fase, grupo.el)
      created++
      await sleep(300)

      for (const tarefa of (grupo.tarefas || [])) {
        const tAssignees = await resolveAssignees(tarefa.assignees)
        const tTask = await clickup.createTask(listId, {
          name:       tarefa.name,
          assignees:  tAssignees,
          start_date: toMs(tarefa.start_date),
          due_date:   toMs(tarefa.due_date),
          parent:     gTask.id,
        })
        await patchFields(tTask.id, tarefa.fase, tarefa.el)
        created++
        await sleep(300)

        for (const sub of (tarefa.subtarefas || [])) {
          const sAssignees = await resolveAssignees(sub.assignees)
          const sTask = await clickup.createTask(listId, {
            name:       sub.name,
            assignees:  sAssignees,
            start_date: toMs(sub.start_date),
            due_date:   toMs(sub.due_date),
            parent:     tTask.id,
          })
          await patchFields(sTask.id, sub.fase, sub.el)
          created++
          await sleep(300)
        }
      }
    }

    res.json({ ok: true, listId, created })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/agent/members
router.get('/members', async (req, res) => {
  try {
    res.json(await getMembers())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/agent/test-task — create one task and report what happened (debug)
router.post('/test-task', async (req, res) => {
  const { listId, name = 'Test Task', assignees = [], fase = 'Produção', el = 'Sim' } = req.body || {}
  if (!listId) return res.status(400).json({ error: 'listId required' })
  const members = await getMembers()
  const resolvedIds = assignees.map(n => resolveMemberId(n, members)).filter(Boolean)
  const resolvedNames = resolvedIds.map(id => members.find(m => m.id === id)?.name)

  let taskId, createError, faseError, elError
  try {
    const t = await clickup.createTask(listId, { name, assignees: resolvedIds })
    taskId = t.id
  } catch(e) { createError = e.message }

  if (taskId) {
    const faseId = FASE_IDS[fase]
    const elId   = EL_IDS[el]
    if (faseId) {
      try { await clickup.updateTaskField(taskId, FASE_FIELD, faseId) }
      catch(e) { faseError = e.response?.data || e.message }
    }
    if (elId) {
      try { await clickup.updateTaskField(taskId, EL_FIELD, elId) }
      catch(e) { elError = e.response?.data || e.message }
    }
  }
  res.json({ taskId, createError, faseError, elError, resolvedIds, resolvedNames })
})

// GET /api/agent/list-tasks/:listId — retorna id e nome de todas as tarefas
router.get('/list-tasks/:listId', async (req, res) => {
  try {
    const tasks = await clickup.getTasks(req.params.listId, { include_closed: true })
    res.json(tasks.map(t => ({ id: t.id, name: t.name, parent: t.parent || null })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/agent/patch-task — atualiza fase e EL de uma tarefa por ID
// Aceita faseFieldId/elFieldId/faseValueId/elValueId para sobrescrever os defaults por lista
router.post('/patch-task', async (req, res) => {
  try {
    const { taskId, fase, el, faseFieldId, elFieldId, faseValueId, elValueId } = req.body
    const resolvedFaseField = faseFieldId || FASE_FIELD
    const resolvedElField   = elFieldId   || EL_FIELD
    const resolvedFaseValue = faseValueId || FASE_IDS[fase]
    const resolvedElValue   = elValueId   || EL_IDS[el]
    const errors = []
    if (resolvedFaseValue) {
      try { await clickup.updateTaskField(taskId, resolvedFaseField, resolvedFaseValue) }
      catch (e) { errors.push({ field: 'fase', err: e.response?.data || e.message }) }
    }
    if (resolvedElValue) {
      try { await clickup.updateTaskField(taskId, resolvedElField, resolvedElValue) }
      catch (e) { errors.push({ field: 'el', err: e.response?.data || e.message }) }
    }
    res.json({ ok: errors.length === 0, taskId, fase, el, errors })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/agent/list-fields/:listId — retorna os custom fields da lista com opções
router.get('/list-fields/:listId', async (req, res) => {
  try {
    const fields = await clickup.getListFields(req.params.listId)
    res.json(fields.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      options: f.type_config?.options || [],
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/agent/delete-list-tasks/:listId — deletes all tasks in a list
router.delete('/delete-list-tasks/:listId', async (req, res) => {
  try {
    const { listId } = req.params
    const tasks = await clickup.getTasks(listId, { include_closed: true })
    let deleted = 0
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    for (const t of tasks) {
      try {
        await clickup.deleteTask(t.id)
        deleted++
        await sleep(200)
      } catch {}
    }
    res.json({ ok: true, deleted, total: tasks.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/agent/delete-task/:taskId — deleta uma task individual
router.delete('/delete-task/:taskId', async (req, res) => {
  try {
    await clickup.deleteTask(req.params.taskId)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/agent/debug — check env vars and ClickUp connectivity
router.get('/debug', async (req, res) => {
  const info = {
    team_id:   process.env.CLICKUP_TEAM_ID,
    folder_id: process.env.CLICKUP_FOLDER_ID,
    token_set: !!process.env.CLICKUP_API_TOKEN,
    token_prefix: process.env.CLICKUP_API_TOKEN?.slice(0, 10),
  }
  try {
    const members = await clickup.getWorkspaceMembers(process.env.CLICKUP_TEAM_ID)
    info.members_ok = true
    info.member_count = members.length
  } catch (e) {
    info.members_error = e.message
    info.members_status = e.response?.status
    info.members_data   = e.response?.data
  }
  try {
    const lists = await clickup.getLists(process.env.CLICKUP_FOLDER_ID)
    info.folder_ok = true
    info.list_count = lists.length
    info.lists = lists.map(l => ({ id: l.id, name: l.name }))
  } catch (e) {
    info.folder_error  = e.message
    info.folder_status = e.response?.status
    info.folder_data   = e.response?.data
  }
  res.json(info)
})

export default router
