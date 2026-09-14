import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const DIR  = dirname(fileURLToPath(import.meta.url))
const DATA = join(DIR, '..', 'data')
const FILE = join(DATA, 'finalized.json')

function read() {
  try {
    if (!existsSync(FILE)) return []
    return JSON.parse(readFileSync(FILE, 'utf8'))
  } catch {
    return []
  }
}

function write(ids) {
  if (!existsSync(DATA)) mkdirSync(DATA, { recursive: true })
  writeFileSync(FILE, JSON.stringify(ids), 'utf8')
}

export function getFinalized() { return read() }
export function isFinalized(id) { return read().includes(id) }

export function finalize(id) {
  const ids = read()
  if (!ids.includes(id)) write([...ids, id])
}

export function unfinalize(id) {
  write(read().filter(x => x !== id))
}
