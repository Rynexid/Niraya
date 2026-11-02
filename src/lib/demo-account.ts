/**
 * Demo account credentials for the login UI.
 *
 * WARNING: This is frontend-only demonstration data. There is no real
 * authentication backend or session in this stage. Replace with Better Auth
 * (already used by the server) once the auth stage is implemented.
 */
export const DEMO_ACCOUNT = {
  email: 'admin@niraya.pos',
  password: 'niraya123',
  name: 'Admin User',
  role: 'admin',
} as const

/**
 * Frontend-only demo sign-in. Returns `true` when the supplied credentials
 * match the demo account. Never used for real access control.
 */
export function signInDemo(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_ACCOUNT.email &&
    password === DEMO_ACCOUNT.password
  )
}
