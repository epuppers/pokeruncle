/**
 * Convert an error into a user-friendly message.
 */
export function friendlyError(err: unknown): string {
  if (!navigator.onLine) {
    return 'You\'re offline. Connect to the internet and try again.'
  }

  const message = err instanceof Error ? err.message : String(err)

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Network error — check your connection and try again.'
  }

  if (message.includes('(429)')) {
    return 'Rate limited — wait a moment and try again.'
  }

  if (message.includes('(401)') || message.includes('(403)')) {
    return 'Authentication failed — check your API key.'
  }

  if (
    message.includes('(500)') ||
    message.includes('(502)') ||
    message.includes('(503)')
  ) {
    return 'The AI service is temporarily unavailable. Try again shortly.'
  }

  return message || 'An unexpected error occurred.'
}
