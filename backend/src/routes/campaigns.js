import { Router } from 'express'
import * as clickup from '../clickup.js'
import { buildDependencyGraph, propagateCascade, getRealStatus, computeRisk } from '../bottleneck.js'
import * as cache from '../cache.js'
import { FIELD_IDS, getFieldValue } from '../fieldMap.js'

const router = Router()

const FOLDER_ID    = () => process.env.CLICKUP_FOLDER_ID
const CAMPAIGN_LIST = () => process.env.CLICKUP_TEMPLATE_LIST_ID  // "Campanhas (em construção)"

async function getGraph(listId, force = false) {
  const key = `graph:${listId}`
  if (!force) {
    const cached = cache.get(key)
    if (cached) return cached
  }
  const graph = await buildDependencyGraph(listId, clickup)
  cache.set(key, graph)
  return graph
}

async function getAlerts(listId, force = false) {
  const key = `alerts:${listId}`
  if (!force) {
    const cached = cache.get(key)
    if (cached) return cached
  }
  const graph = await getGraph(listId, force)
  const alertas = propagateCascade(graph, Date.now())
  cache.set(key, alertas)
  return alertas
}

// GET /api/campaigns
// Returns campaign tasks from the "Campanhas (em construção)" list
router.get('/', async (req, res) => {
  try {
    const tasks = await clickup.getCampaignTasks(CAMPAIGN_LIST())
    res.json(tasks
      .filter(t => !t.name.toUpperCase().startsWith('TEMPLATE'))
      .map(t => ({
        id: t.id,
        name: t.name,
        status: t.status?.status,
        url: t.url,
      })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id/subtasks — subtasks with RACI for a campaign task
router.get('/:id/subtasks', async (req, res) => {
  try {
    const subtasks = await clickup.getSubtasks(req.params.id, CAMPAIGN_LIST())
    const { FIELD_IDS, getFieldValue, getPeopleField, getPeopleArrayField } = await import('../fieldMap.js')
    res.json(subtasks.map(t => ({
      id: t.id,
      name: t.name,
      status: t.status?.status,
      statusType: t.status?.type,
      due_date: t.due_date,
      start_date: t.start_date,
      url: t.url,
      responsavel: getPeopleField(t, FIELD_IDS.responsavel),
      aprovador: getPeopleField(t, FIELD_IDS.aprovador),
      consultar: getFieldValue(t, FIELD_IDS.consultar),
      informar: getPeopleArrayField(t, FIELD_IDS.informar),
      fase: getFieldValue(t, FIELD_IDS.faseCampanha),
      canal: getFieldValue(t, FIELD_IDS.canal),
      etapaLimitante: getFieldValue(t, FIELD_IDS.etapaLimitante) === 'Sim',
      leadTime: getFieldValue(t, FIELD_IDS.leadTime),
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id
router.get('/:id', async (req, res) => {
  try {
    const alertas = await getAlerts(req.params.id)
    const graph = await getGraph(req.params.id)
    const today = Date.now()
    const tasksByFase = {}
    for (const [id, node] of graph) {
      const fase = node.fase || 'Sem fase'
      if (!tasksByFase[fase]) tasksByFase[fase] = []
      tasksByFase[fase].push({
        ...node.task,
        realStatus: getRealStatus(id, graph, today),
        responsavel: node.responsavel,
        etapaLimitante: node.etapaLimitante,
        fase: node.fase,
        canal: node.canal,
      })
    }
    res.json({
      id: req.params.id,
      alertas,
      risco: computeRisk(alertas),
      tasksByFase,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id/tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const graph = await getGraph(req.params.id)
    const today = Date.now()
    const tasks = [...graph.values()].map(node => ({
      ...node.task,
      realStatus: getRealStatus(node.task.id, graph, today),
      responsavel: node.responsavel,
      aprovador: node.aprovador,
      consultar: node.consultar,
      informar: node.informar,
      etapaLimitante: node.etapaLimitante,
      leadTime: node.leadTime,
      bloqueiaQual: node.bloqueiaQualNome,
      fase: node.fase,
      canal: node.canal,
    }))
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id/alerts
router.get('/:id/alerts', async (req, res) => {
  try {
    res.json(await getAlerts(req.params.id))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/campaigns/:id/refresh
router.post('/:id/refresh', async (req, res) => {
  try {
    cache.del(`graph:${req.params.id}`)
    cache.del(`alerts:${req.params.id}`)
    const alertas = await getAlerts(req.params.id, true)
    res.json({ ok: true, alertas })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id/direcionamento
router.get('/:id/direcionamento', async (req, res) => {
  try {
    const details = await clickup.getListDetails(req.params.id)
    res.json({
      id: req.params.id,
      name: details.name,
      description: details.content || details.description || '',
      status: details.status,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id/assets
router.get('/:id/assets', async (req, res) => {
  try {
    const graph = await getGraph(req.params.id)
    const today = Date.now()
    const assets = [...graph.values()]
      .filter(node => node.fase === 'Produção' || node.canal)
      .map(node => ({
        id: node.task.id,
        name: node.task.name,
        status: node.task.status,
        realStatus: getRealStatus(node.task.id, graph, today),
        responsavel: node.responsavel,
        canal: node.canal,
        fase: node.fase,
        informar: node.informar,
        url: node.task.url,
        due_date: node.task.due_date,
      }))
    res.json(assets)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id/calendario
router.get('/:id/calendario', async (req, res) => {
  try {
    const graph = await getGraph(req.params.id)
    const today = Date.now()
    const tasks = [...graph.values()]
      .filter(node => node.task.due_date || node.fase === 'Live')
      .map(node => ({
        id: node.task.id,
        name: node.task.name,
        status: node.task.status,
        realStatus: getRealStatus(node.task.id, graph, today),
        responsavel: node.responsavel,
        canal: node.canal,
        fase: node.fase,
        due_date: node.task.due_date,
        start_date: node.task.start_date,
        etapaLimitante: node.etapaLimitante,
        url: node.task.url,
      }))
      .sort((a, b) => (Number(a.due_date) || 0) - (Number(b.due_date) || 0))
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id/debriefing
router.get('/:id/debriefing', async (req, res) => {
  try {
    const graph = await getGraph(req.params.id)
    const today = Date.now()
    const allTasks = [...graph.values()]
    const debriefTasks = allTasks.filter(n => n.fase === 'Retrospectiva')
    const total = allTasks.length
    const concluidas = allTasks.filter(n => n.task.status?.type === 'closed').length
    const atrasadas = allTasks.filter(n => {
      const s = getRealStatus(n.task.id, graph, today)
      return s?.status === 'ATRASADA'
    }).length
    res.json({
      tasks: debriefTasks.map(n => ({
        id: n.task.id,
        name: n.task.name,
        status: n.task.status,
        description: n.task.description,
      })),
      metricas: { total, concluidas, atrasadas, pct: total ? Math.round(concluidas / total * 100) : 0 },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id/ofertas
router.get('/:id/ofertas', async (req, res) => {
  try {
    const graph = await getGraph(req.params.id)
    const tasks = [...graph.values()]
      .filter(n => n.fase === 'Estratégia')
      .map(n => ({ id: n.task.id, name: n.task.name, status: n.task.status, description: n.task.description }))
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
