import { SYSTEM_PROMPT, FEW_SHOT_EXAMPLES } from './notePrompt'

const LLM7_URL = 'https://api.llm7.io/v1/chat/completions'
const MODEL = 'nova-fast'
const MAX_TOKENS = 150

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletion {
  choices: Array<{
    message: { content: string }
  }>
}

/**
 * Clean up LLM output: strip quotes, prefixes, and enforce 100-char limit.
 */
export function postProcessNote(raw: string): string {
  let note = raw.trim()

  // Strip surrounding quotes
  note = note.replace(/^["']+|["']+$/g, '').trim()

  // Strip common prefixes the model might add
  note = note.replace(/^(note|player note|villain note):\s*/i, '').trim()

  // Hard truncate at 100 chars on word boundary
  if (note.length > 100) {
    note = note.slice(0, 100).replace(/\s+\S*$/, '')
  }

  return note
}

/**
 * Build the messages array with system prompt, few-shot pairs, and actual input.
 */
function buildMessages(handHistoryText: string): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ]

  for (const example of FEW_SHOT_EXAMPLES) {
    messages.push({ role: 'user', content: example.input })
    messages.push({ role: 'assistant', content: example.output })
  }

  messages.push({ role: 'user', content: handHistoryText })

  return messages
}

/**
 * Send hand history text to LLM7.io and get a player note back.
 * No API key required — this is a free, CORS-enabled service.
 */
export async function generateNote(handHistoryText: string): Promise<string> {
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
