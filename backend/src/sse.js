// Server-Sent Events — broadcast updates to all connected frontend clients
const clients = new Set()

export function addClient(res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  res.write('data: {"type":"connected"}\n\n')
  clients.add(res)
  return () => clients.delete(res)
}

export function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`
  for (const client of clients) {
    try { client.write(data) } catch { clients.delete(client) }
  }
}
