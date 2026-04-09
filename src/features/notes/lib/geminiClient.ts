import { buildMessages, postProcessNote } from './noteUtils'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const MODEL = 'gemini-2.0-flash'
const MAX_TOKENS = 150

interface ChatCompletion {
  choices: Array<{
    message: { content: string }
  }>
}

/**
 * Send hand history text to Gemini Flash and get a player note back.
 * Requires a Gemini API key.
 */
export async function generateNoteGemini(
  handHistoryText: string,
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API key is required')
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: buildMessages(handHistoryText),
      max_tokens: MAX_TOKENS,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Gemini request failed (${response.status}): ${text || response.statusText}`,
    )
  }

  const data: unknown = await response.json()
  const completion = data as ChatCompletion

  const content = completion.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Gemini returned an empty response')
  }

  return postProcessNote(content)
}
