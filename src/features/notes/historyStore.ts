import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod/v4'

import type { SavedNote, LlmProviderId } from './types'
import { LLM_PROVIDER_IDS } from './types'

const MAX_NOTES = 50

const savedNoteSchema = z.object({
  id: z.string(),
  note: z.string(),
  ocrText: z.string(),
  createdAt: z.number(),
  villainName: z.string().optional(),
})

const historyStateSchema = z.object({
  notes: z.array(savedNoteSchema),
  activeProvider: z.enum(LLM_PROVIDER_IDS),
  geminiApiKey: z.string(),
})

interface NoteHistoryState {
  notes: SavedNote[]
  activeProvider: LlmProviderId
  geminiApiKey: string
}

interface NoteHistoryActions {
  addNote: (note: SavedNote) => void
  deleteNote: (id: string) => void
  clearHistory: () => void
  appendToVillain: (villainName: string, newNote: string, ocrText: string) => void
  setActiveProvider: (provider: LlmProviderId) => void
  setGeminiApiKey: (key: string) => void
}

const defaultState: NoteHistoryState = {
  notes: [],
  activeProvider: 'llm7',
  geminiApiKey: '',
}

export const useNoteHistoryStore = create(
  persist<NoteHistoryState & NoteHistoryActions>(
    (set) => ({
      ...defaultState,

      addNote: (note) =>
        set((state) => ({
          notes: [note, ...state.notes].slice(0, MAX_NOTES),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),

      clearHistory: () => set({ notes: [] }),

      appendToVillain: (villainName, newNote, ocrText) =>
        set((state) => {
          const lowerName = villainName.toLowerCase()
          const existingIndex = state.notes.findIndex(
            (n) => n.villainName?.toLowerCase() === lowerName,
          )

          if (existingIndex === -1) {
            // No existing note for this villain — create new
            const note: SavedNote = {
              id: crypto.randomUUID(),
              note: newNote,
              ocrText,
              createdAt: Date.now(),
              villainName,
            }
            return { notes: [note, ...state.notes].slice(0, MAX_NOTES) }
          }

          // Append to existing
          const notes = [...state.notes]
          const existing = notes[existingIndex]
          const combined = `${existing.note}; ${newNote}`
          notes[existingIndex] = {
            ...existing,
            note: combined.length > 200
              ? combined.slice(0, 200).replace(/\s+\S*$/, '')
              : combined,
            ocrText: `${existing.ocrText}\n---\n${ocrText}`,
            createdAt: Date.now(),
          }

          // Move to top
          const [updated] = notes.splice(existingIndex, 1)
          return { notes: [updated, ...notes] }
        }),

      setActiveProvider: (provider) => set({ activeProvider: provider }),

      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
    }),
    {
      name: 'poker-notes-history',
      merge: (persisted, current) => {
        const result = historyStateSchema.safeParse(persisted)
        if (result.success) {
          return { ...current, ...result.data }
        }
        return current
      },
    },
  ),
)
