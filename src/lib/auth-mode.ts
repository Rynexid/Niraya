export const DEMO_COOKIE = 'niraya_demo'

/** Returns true when the browser is in the local demo session. */
export function isDemoMode() {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim() === `${DEMO_COOKIE}=1`)
}

/** Enables the local demo session for one day. */
export function setDemoModeCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=86400; samesite=lax`
}

/** Removes the demo session so the next load uses the real account. */
export function clearDemoModeCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0; samesite=lax`
}
