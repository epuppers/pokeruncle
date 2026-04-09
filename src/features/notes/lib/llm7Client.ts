import { buildMessages, postProcessNote } from './noteUtils'

const LLM7_URL = 'https://api.llm7.io/v1/chat/completions'
const MODEL = 'nova-fast'
const MAX_TOKENS = 150

interface ChatCompletion {
  choices: Array<{
    message: { content: string }
  }>
}

/**
 * Send hand history text to LLM7.io and get a player note back.
 * No API key required — this is a free, CORS-enabled service.
 */
export async function generateNoteLlm7(handHistoryText: string): Promise<string> {
  const response = await fetch(LLM7_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: buildMessages(handHistoryText),
      max_tokens: MAX_TOKENS,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `LLM7 request failed (${response.status}): ${text || response.statusText}`
    )
  }

  const data: unknown = await response.json()
  const completion = data as ChatCompletion

  const content = completion.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('LLM7 returned an empty response')
  }

  return postProcessNote(content)
}

// Re-exports for backwards compatibility
export { postProcessNote } from './noteUtils'
export { generateNoteLlm7 as generateNote }
