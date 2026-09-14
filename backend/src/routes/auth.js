import { Router } from 'express'
import { validateLogin, generateToken } from '../auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const { email, code } = req.body || {}
  if (!email || !code) return res.status(400).json({ error: 'Email e código obrigatórios' })
  if (!validateLogin(email, code)) return res.status(401).json({ error: 'Código de acesso inválido' })
  const token = generateToken(email)
  const name = email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  res.json({ token, email, name })
})

export default router
