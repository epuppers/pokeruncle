import type { RegionConfig } from './lib/preprocessing.types'

export type OcrStatus = 'idle' | 'loading' | 'done' | 'error'
export type LlmStatus = 'idle' | 'loading' | 'done' | 'error'

export const LLM_PROVIDER_IDS = ['llm7', 'gemini'] as const
export type LlmProviderId = (typeof LLM_PROVIDER_IDS)[number]

export const LLM_PROVIDER_LABELS: Record<LlmProviderId, string> = {
  llm7: 'LLM7 (free)',
  gemini: 'Gemini Flash',
}

export interface LlmProviderConfig {
  activeProvider: LlmProviderId
  geminiApiKey: string
}

export interface NotesState {
  /** The raw image data URL from the user's screenshot */
  imageDataUrl: string | null

  /** OCR-extracted text (editable by user) */
  ocrText: string

  /** Current OCR processing status */
  ocrStatus: OcrStatus

  /** OCR error message, if any */
  ocrError: string | null

  /** LLM-generated player note */
  note: string

  /** Current LLM processing status */
  llmStatus: LlmStatus

  /** LLM error message, if any */
  llmError: string | null

  /** Crop region for OCR preprocessing */
  regionConfig: RegionConfig

  /** Active LLM provider */
  activeProvider: LlmProviderId

  /** Gemini API key (stored in-memory, persisted via history store) */
  geminiApiKey: string

  /** Optional villain name for append mode */
  villainName: string
}

export type GoldenExampleCategory =
  | 'overcalling'
  | 'bluff-spots'
  | 'sizing-tells'
  | 'positional-leaks'
  | 'passive-play'
  | 'aggro-lines'
  | 'standard-line'
  | 'multiway'
  | 'allin-preflop'
  | 'garbled-ocr'

export interface GoldenExample {
  id: string
  category: GoldenExampleCategory
  ocrText: string
  idealNote: string
  requiredSubstrings: string[]
}

export interface NotesActions {
  setImage: (dataUrl: string) => void
  setOcrText: (text: string) => void
  setOcrStatus: (status: OcrStatus, error?: string) => void
  setNote: (note: string) => void
  setLlmStatus: (status: LlmStatus, error?: string) => void
  setRegionConfig: (region: RegionConfig) => void
  setActiveProvider: (provider: LlmProviderId) => void
  setGeminiApiKey: (key: string) => void
  setVillainName: (name: string) => void
  reset: () => void
}

export interface SavedNote {
  id: string
  note: string
  ocrText: string
  createdAt: number
  villainName?: string
}
