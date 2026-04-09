import type { RegionConfig } from './lib/preprocessing.types'

export type OcrStatus = 'idle' | 'loading' | 'done' | 'error'
export type LlmStatus = 'idle' | 'loading' | 'done' | 'error'

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
  reset: () => void
}
