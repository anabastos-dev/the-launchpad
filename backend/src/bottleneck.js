import { FIELD_IDS, getFieldValue, getPeopleField, getPeopleArrayField } from './fieldMap.js'

const MS_PER_DAY = 86400000

function isConcluded(task) {
  const type = task.status?.type
  if (type === 'closed' || type === 'done') return true
  const name = (task.status?.status || '').toLowerCase()
  return name === 'cancelado' || name === 'concluído' || name === 'concluido' || name === 'complete'
}

function isNativelyBlocked(task) {
  const name = (task.status?.status || '').toLowerCase()
  return name === 'bloqueado' || name === 'blocked' || name === 'aguardando'
}

export async function buildDependencyGraph(listId, clickup) {
  const tasks = await clickup.getTasks(listId, { include_closed: true })
  const graph = new Map()

  // Build nodes
  for (const task of tasks) {
    graph.set(task.id, {
      task,
      blockedBy: [],
      blocks: [],
      bloqueiaQualNome: getFieldValue(task, FIELD_IDS.bloqueiaQual),
      responsavel: getPeopleField(task, FIELD_IDS.responsavel) || task.assignees?.[0]?.username || null,
      aprovador: getPeopleField(task, FIELD_IDS.aprovador),
      consultar: getFieldValue(task, FIELD_IDS.consultar),
      informar: getPeopleArrayField(task, FIELD_IDS.informar),
      etapaLimitante: getFieldValue(task, FIELD_IDS.etapaLimitante) === 'Sim',
      leadTime: getFieldValue(task, FIELD_IDS.leadTime) || 1,
      fase: getFieldValue(task, FIELD_IDS.faseCampanha),
      canal: getFieldValue(task, FIELD_IDS.canal),
    })
  }

  // Fetch dependencies in parallel
  const depResults = await Promise.all(
    tasks.map(t => clickup.getDependencies(t.id).then(deps => ({ taskId: t.id, deps })))
  )

  for (const { taskId, deps } of depResults) {
    const node = graph.get(taskId)
    if (!node) continue
    for (const dep of deps) {
      if (dep.type === 'waiting_on') node.blockedBy.push(dep.task_id)
      else if (dep.type === 'blocking') node.blocks.push(dep.task_id)
    }
  }

  // Build reverse edges
  for (const [taskId, node] of graph) {
    for (const blockerId of node.blockedBy) {
      const bn = graph.get(blockerId)
      if (bn && !bn.blocks.includes(taskId)) bn.blocks.push(taskId)
    }
  }

  // Resolve text-based dependencies (Bloqueia qual tarefa? field)
  for (const [, node] of graph) {
    if (!node.bloqueiaQualNome) continue
    const target = [...graph.values()].find(n =>
      n.task.name.toLowerCase().includes(node.bloqueiaQualNome.toLowerCase())
    )
    if (target && !node.blocks.includes(target.task.id)) {
      node.blocks.push(target.task.id)
      if (!target.blockedBy.includes(node.task.id)) target.blockedBy.push(node.task.id)
    }
  }

  return graph
}

export function getRealStatus(taskId, graph, today) {
  const node = graph.get(taskId)
  if (!node) return null
  const { task } = node
  const todayMs = typeof today === 'number' ? today : today.getTime()

  if (isConcluded(task)) return { status: 'CONCLUIDA' }

  // Natively blocked by ClickUp status
  if (isNativelyBlocked(task)) {
    return {
      status: 'BLOQUEADA',
      bloqueadores: [],
      motivo: `Status: ${task.status?.status}`,
      diasRestantes: task.due_date ? Math.ceil((Number(task.due_date) - todayMs) / MS_PER_DAY) : null,
    }
  }

  // RACI incomplete
  if (!node.responsavel) return { status: 'RACI_INCOMPLETO', motivo: 'sem responsável' }

  // Blocked by dependency
  const bloqueadores = node.blockedBy
    .map(id => graph.get(id))
    .filter(n => n && !isConcluded(n.task))

  if (bloqueadores.length > 0) {
    return {
      status: 'BLOQUEADA',
      bloqueadores: bloqueadores.map(n => ({
        id: n.task.id,
        nome: n.task.name,
        responsavel: n.responsavel,
      })),
    }
  }

  if (!task.due_date) return { status: 'SEM_PRAZO' }

  const diasRestantes = Math.ceil((Number(task.due_date) - todayMs) / MS_PER_DAY)
  const leadTime = node.leadTime

  if (diasRestantes < 0) return { status: 'ATRASADA', diasRestantes }
  if (diasRestantes <= leadTime) return { status: 'EM_RISCO', diasRestantes, leadTime }
  return { status: 'OK', diasRestantes }
}

function getDownstreamImpact(taskId, graph, visited = new Set()) {
  if (visited.has(taskId)) return []
  visited.add(taskId)
  const node = graph.get(taskId)
  if (!node) return []
  const diretos = node.blocks
    .map(id => graph.get(id))
    .filter(n => n && !isConcluded(n.task))
  const indiretos = node.blocks.flatMap(id => getDownstreamImpact(id, graph, visited))
  const seen = new Set()
  return [...diretos, ...indiretos].filter(n => {
    if (seen.has(n.task.id)) return false
    seen.add(n.task.id)
    return true
  })
}

function buildCadeia(rootTask, impactados) {
  if (impactados.length === 0) return rootTask.name
  return [rootTask.name, ...impactados.slice(0, 4).map(n => n.task.name)].join(' → ')
}

function formatDate(ms) {
  return new Date(Number(ms)).toLocaleDateString('pt-BR')
}

function buildMensagem(taskRaiz, impactados, realStatus, node) {
  const cadeia = buildCadeia(taskRaiz, impactados)
  const pessoas = [...new Set([
    node?.responsavel,
    ...impactados.map(n => n.responsavel),
  ].filter(Boolean))]

  const proximoPrazo = impactados
    .filter(n => n.task.due_date)
    .sort((a, b) => Number(a.task.due_date) - Number(b.task.due_date))[0]

  return {
    headline: impactados.length > 0
      ? `"${taskRaiz.name}" está bloqueando ${impactados.length} tarefa(s)`
      : realStatus.status === 'ATRASADA'
        ? `"${taskRaiz.name}" — atrasada ${Math.abs(realStatus.diasRestantes || 0)} dia(s)`
        : `"${taskRaiz.name}" — bloqueada`,
    cadeia,
    pessoas,
    urgencia: proximoPrazo
      ? `Próxima tarefa impactada vence em ${formatDate(proximoPrazo.task.due_date)}`
      : realStatus.diasRestantes != null && realStatus.diasRestantes < 0
        ? `Prazo passou há ${Math.abs(realStatus.diasRestantes)} dia(s)`
        : null,
    acao: impactados.length > 0
      ? `Desbloquear: ${taskRaiz.name}`
      : realStatus.status === 'ATRASADA'
        ? `Concluir ou replanejar: ${taskRaiz.name}`
        : `Remover bloqueio de: ${taskRaiz.name}`,
    responsavelRaiz: node?.responsavel || null,
  }
}

export function propagateCascade(graph, today) {
  const alertas = []
  const todayMs = typeof today === 'number' ? today : today.getTime()

  for (const [taskId, node] of graph) {
    if (isConcluded(node.task)) continue

    const realStatus = getRealStatus(taskId, graph, todayMs)
    if (!realStatus) continue

    // Handoff pendente
    if (node.task.name.startsWith('✅ HANDOFF')) {
      const impactados = getDownstreamImpact(taskId, graph)
      alertas.push({
        tipo: 'HANDOFF_PENDENTE',
        severidade: 'INFO',
        taskRaiz: node.task,
        impactados: impactados.map(n => n.task),
        mensagem: buildMensagem(node.task, impactados, realStatus, node),
      })
      continue
    }

    // RACI incompleto
    if (realStatus.status === 'RACI_INCOMPLETO') {
      alertas.push({
        tipo: 'RACI_INCOMPLETO',
        severidade: 'WARNING',
        taskRaiz: node.task,
        impactados: [],
        mensagem: {
          headline: `"${node.task.name}" sem responsável definido`,
          cadeia: node.task.name,
          pessoas: [],
          urgencia: null,
          acao: 'Preencher campo (Campanhas) - Responsável',
          responsavelRaiz: null,
        },
      })
      continue
    }

    if (!['ATRASADA', 'BLOQUEADA', 'EM_RISCO'].includes(realStatus.status)) continue

    const impactados = getDownstreamImpact(taskId, graph)

    // Only generate cascade alert if there's downstream impact OR task is overdue
    if (impactados.length === 0 && realStatus.status !== 'ATRASADA' && !isNativelyBlocked(node.task)) continue

    const severidade =
      realStatus.status === 'ATRASADA' && impactados.length >= 2 ? 'HIGH' :
      realStatus.status === 'ATRASADA' ? 'MEDIUM' :
      realStatus.status === 'BLOQUEADA' ? 'MEDIUM' : 'LOW'

    alertas.push({
      tipo: 'CASCATA',
      severidade,
      taskRaiz: node.task,
      realStatus,
      impactados: impactados.map(n => n.task),
      mensagem: buildMensagem(node.task, impactados, realStatus, node),
    })
  }

  return alertas.sort((a, b) => {
    const ordem = { HIGH: 0, MEDIUM: 1, WARNING: 2, INFO: 3, LOW: 4 }
    if (a.severidade !== b.severidade) return ordem[a.severidade] - ordem[b.severidade]
    return b.impactados.length - a.impactados.length
  })
}

export function computeRisk(alertas) {
  if (alertas.some(a => a.severidade === 'HIGH')) return 'HIGH'
  if (alertas.some(a => a.severidade === 'MEDIUM')) return 'MEDIUM'
  if (alertas.some(a => a.severidade === 'WARNING')) return 'WARNING'
  return 'OK'
}
