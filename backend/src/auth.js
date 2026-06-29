import jwt from 'jsonwebtoken'

const USERS = {
  ana:  { name: 'Ana Bastos', password: process.env.AUTH_PASS_ANA },
  joao: { name: 'João',       password: process.env.AUTH_PASS_JOAO },
}

export function validateLogin(user, password) {
  const u = USERS[user]
  if (!u || !u.password) return false
  return password === u.password
}

export function generateToken(user) {
  return jwt.sign({ user, name: USERS[user]?.name }, process.env.JWT_SECRET, { expiresIn: '8h' })
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
