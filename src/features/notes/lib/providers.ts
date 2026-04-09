import type { LlmProviderId } from '../types'
import { generateNoteLlm7 } from './llm7Client'
import { generateNoteGemini } from './geminiClient'

/**
 * Generate a player note using the specified LLM provider.
 */
export async function generateNoteWithProvider(
  handHistoryText: string,
  providerId: LlmProviderId,
  apiKey?: string,
): Promise<string> {
  switch (providerId) {
    case 'llm7':
      return generateNoteLlm7(handHistoryText)
    case 'gemini':
      return generateNoteGemini(handHistoryText, apiKey ?? '')
  }
}
