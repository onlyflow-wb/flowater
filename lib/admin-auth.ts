import bcrypt from 'bcryptjs'

export async function verifyAdminCredentials(username: string, password: string) {
  const adminUser = process.env.ADMIN_USER
  const adminPass = process.env.ADMIN_PASS
  const adminPassHash = process.env.ADMIN_PASS_HASH

  if (!adminUser || (!adminPass && !adminPassHash)) return false
  if (username !== adminUser) return false

  if (adminPassHash) {
    return bcrypt.compare(password, adminPassHash)
  }

  return password === adminPass
}
