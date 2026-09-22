import jwt from 'jsonwebtoken'

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'ana.bastos@minimalclub.com.br').toLowerCase()

export function nameFromEmail(email) {
  const local = (email || '').split('@')[0]
  return local.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function getRole(email) {
  return (email || '').toLowerCase() === ADMIN_EMAIL ? 'admin' : 'lider'
}

export function validateLogin(email, code) {
  if (!email || !code) return false
  return code === process.env.ACCESS_CODE
}

export function generateToken(email, name) {
  return jwt.sign({ email, name: name || nameFromEmail(email), role: getRole(email) }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

export function authMiddleware(req, res, next) {
  const header = req.headers['authorization']
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' })
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

// Use after authMiddleware — admin-only routes (e.g. editing the marketing calendar)
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito ao admin' })
  next()
}
