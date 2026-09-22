import { Router } from 'express'
import { validateLogin, generateToken, getRole, isAllowedDomain, nameFromEmail } from '../auth.js'
import { getMembers, resolveMemberByEmail } from '../members.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, code } = req.body || {}
  if (!email || !code) return res.status(400).json({ error: 'Email e código obrigatórios' })
  if (!validateLogin(email, code)) return res.status(401).json({ error: 'Código de acesso inválido' })

  const role = getRole(email)

  // Anyone with a company email can log in as líder — access to specific
  // features (calendar edit, etc.) is granted separately by the admin.
  if (role !== 'admin' && !isAllowedDomain(email)) {
    return res.status(401).json({ error: 'E-mail fora dos domínios liberados' })
  }

  // Use the real ClickUp name when this email matches a workspace member —
  // falls back to a name derived from the email for anyone not in ClickUp yet.
  const members = await getMembers().catch(() => [])
  const member = resolveMemberByEmail(email, members)
  const name = member?.name || nameFromEmail(email)

  const token = generateToken(email, name)
  res.json({ token, email, name, role })
})

export default router
