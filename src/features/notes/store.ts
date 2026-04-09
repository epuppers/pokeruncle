import { create } from 'zustand'

import type { NotesState, NotesActions, OcrStatus, LlmStatus, LlmProviderId } from './types'
import type { RegionConfig } from './lib/preprocessing.types'
import { GGPOKER_PRESET } from './lib/presets'

const initialState: NotesState = {
  imageDataUrl: null,
  ocrText: '',
  ocrStatus: 'idle',
  ocrError: null,
  note: '',
  llmStatus: 'idle',
  llmError: null,
  regionConfig: GGPOKER_PRESET.region!,
  activeProvider: 'llm7',
  geminiApiKey: '',
  villainName: '',
}

export const useNotesStore = create<NotesState & NotesActions>()((set) => ({
  ...initialState,

  setImage: (dataUrl: string) =>
    set({ imageDataUrl: dataUrl, ocrText: '', ocrStatus: 'idle', ocrError: null, note: '', llmStatus: 'idle', llmError: null }),

  setOcrText: (text: string) => set({ ocrText: text }),

  setOcrStatus: (status: OcrStatus, error?: string) =>
    set({ ocrStatus: status, ocrError: error ?? null }),

  setNote: (note: string) => set({ note }),

  setLlmStatus: (status: LlmStatus, error?: string) =>
    set({ llmStatus: status, llmError: error ?? null }),

  setRegionConfig: (region: RegionConfig) => set({ regionConfig: region }),

  setActiveProvider: (provider: LlmProviderId) => set({ activeProvider: provider }),

  setGeminiApiKey: (key: string) => set({ geminiApiKey: key }),

  setVillainName: (name: string) => set({ villainName: name }),

  reset: () => set(initialState),
}))
