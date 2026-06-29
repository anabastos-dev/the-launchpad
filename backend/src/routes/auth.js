import { Router } from 'express'
import { validateLogin, generateToken } from '../auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const { user, password } = req.body || {}
  if (!user || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' })
  if (!validateLogin(user, password)) return res.status(401).json({ error: 'Credenciais inválidas' })
  res.json({ token: generateToken(user), user })
})

export default router
