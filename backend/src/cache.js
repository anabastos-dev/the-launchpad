import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 }) // 15 min TTL

export function get(key) { return cache.get(key) }
export function set(key, value) { cache.set(key, value) }
export function del(key) { cache.del(key) }
export function delByPrefix(prefix) {
  const keys = cache.keys().filter(k => k.startsWith(prefix))
  keys.forEach(k => cache.del(k))
}
export function flush() { cache.flushAll() }
