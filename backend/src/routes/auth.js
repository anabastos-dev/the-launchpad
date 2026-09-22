import { Router } from 'express'
import { validateLogin, generateToken, getRole, nameFromEmail } from '../auth.js'
import { getMembers, resolveMemberByEmail } from '../members.js'
import { hasAccess } from '../access.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, code } = req.body || {}
  if (!email || !code) return res.status(400).json({ error: 'Email e código obrigatórios' })
  if (!validateLogin(email, code)) return res.status(401).json({ error: 'Código de acesso inválido' })

  const role = getRole(email)
  let name = null

  if (role !== 'admin') {
    // Anyone who isn't the admin must (a) be a real member of the ClickUp
    // workspace and (b) have been explicitly granted access by the admin —
    // the shared access code alone isn't enough to get in as "líder".
    const members = await getMembers().catch(() => [])
    const member = resolveMemberByEmail(email, members)
    if (!member) return res.status(401).json({ error: 'E-mail não encontrado no workspace do ClickUp' })
    if (!(await hasAccess(email))) return res.status(403).json({ error: 'Seu acesso ainda não foi liberado. Fale com a Ana.' })
    name = member.name
  }

  name = name || nameFromEmail(email)
  const token = generateToken(email, name)
  res.json({ token, email, name, role })
})

export default router
