import { SYSTEM_PROMPT, FEW_SHOT_EXAMPLES } from './notePrompt'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Build the messages array with system prompt, few-shot pairs, and actual input.
 */
export function buildMessages(handHistoryText: string): ChatMessage[] {
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

export type { ChatMessage }
