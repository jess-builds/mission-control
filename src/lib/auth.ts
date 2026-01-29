import { cookies } from 'next/headers'

const VALID_CREDENTIALS = {
  email: 'armaan',
  password: 'test123'
}

const SESSION_COOKIE = 'mission-control-session'

export async function login(email: string, password: string): Promise<boolean> {
  if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    return true
  }
  return false
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return session?.value === 'authenticated'
}
