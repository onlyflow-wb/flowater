import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const ADMIN_FILE = path.join(process.cwd(), '.admin-auth.json')

type AdminStore = {
  username: string
  passwordHash: string
}

export async function verifyAdminCredentials(username: string, password: string) {
  const store = getStoredAdmin()
  if (store) {
    if (username !== store.username) return false
    return bcrypt.compare(password, store.passwordHash)
  }

  const adminUser = process.env.ADMIN_USER
  const adminPass = process.env.ADMIN_PASS

  if (!adminUser || !adminPass) return false

  return username === adminUser && password === adminPass
}

export async function updateAdminPassword(username: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 12)

  const payload: AdminStore = {
    username,
    passwordHash,
  }

  fs.writeFileSync(ADMIN_FILE, JSON.stringify(payload, null, 2), 'utf8')
}

function getStoredAdmin(): AdminStore | null {
  try {
    if (!fs.existsSync(ADMIN_FILE)) return null
    const raw = fs.readFileSync(ADMIN_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}
