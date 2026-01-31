/**
 * Timezone utilities for Mission Control
 * All dates should be in America/Toronto (EST/EDT)
 * Never use UTC for user-facing dates
 */

const TIMEZONE = 'America/Toronto'

/**
 * Get today's date in EST/EDT as YYYY-MM-DD string
 */
export function getTodayEST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

/**
 * Get current hour in EST/EDT (0-23)
 */
export function getCurrentHourEST(): number {
  const hour = new Date().toLocaleString('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: TIMEZONE
  })
  return parseInt(hour)
}

/**
 * Convert a Date object to YYYY-MM-DD string in EST/EDT
 */
export function toDateStringEST(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

/**
 * Get current timestamp in EST/EDT as ISO string
 * Note: This is for display/logging. For database storage, 
 * ISO timestamps are fine as they're absolute points in time.
 */
export function getNowISO(): string {
  return new Date().toISOString()
}

/**
 * Format a date for display in EST/EDT
 */
export function formatDateEST(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString('en-US', { 
    timeZone: TIMEZONE,
    ...options 
  })
}

/**
 * Get tomorrow's date in EST/EDT as YYYY-MM-DD string
 */
export function getTomorrowEST(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}
