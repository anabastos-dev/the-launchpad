import jwt from 'jsonwebtoken'

function nameFromEmail(email) {
  const local = (email || '').split('@')[0]
  return local.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function validateLogin(email, code) {
  if (!email || !code) return false
  return code === process.env.ACCESS_CODE
}

export function generateToken(email) {
  const name = nameFromEmail(email)
  return jwt.sign({ email, name }, process.env.JWT_SECRET, { expiresIn: '30d' })
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
