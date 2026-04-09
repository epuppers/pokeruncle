import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAnalyzerStore } from '@/stores/analyzerStore'
import { detectBoardCards } from '@/features/detection/lib/cardDetector'
import { parsePositions } from '@/features/detection/lib/positionParser'

import { useNotesStore } from '../store'
import { useNoteHistoryStore } from '../historyStore'
import { loadImage, preprocessForOcr } from '../lib/imagePreprocessor'
import { recognizeText } from '../lib/tesseractWorker'
import { generateNoteWithProvider } from '../lib/providers'
import { friendlyError } from '../lib/errorMessages'
import { GGPOKER_PRESET } from '../lib/presets'
import { LLM_PROVIDER_IDS, LLM_PROVIDER_LABELS } from '../types'
import type { LlmProviderId } from '../types'
import { ScreenshotInput } from './ScreenshotInput'
import { PreprocessPreview } from './PreprocessPreview'
import { OcrPreview } from './OcrPreview'
import { NoteResult } from './NoteResult'
import { NoteHistory } from './NoteHistory'

export function NotesPage() {
  const imageDataUrl = useNotesStore((s) => s.imageDataUrl)
  const ocrText = useNotesStore((s) => s.ocrText)
  const ocrStatus = useNotesStore((s) => s.ocrStatus)
  const llmStatus = useNotesStore((s) => s.llmStatus)
  const regionConfig = useNotesStore((s) => s.regionConfig)
  const activeProvider = useNotesStore((s) => s.activeProvider)
  const geminiApiKey = useNotesStore((s) => s.geminiApiKey)
  const villainName = useNotesStore((s) => s.villainName)
  const setOcrText = useNotesStore((s) => s.setOcrText)
  const setOcrStatus = useNotesStore((s) => s.setOcrStatus)
  const setNote = useNotesStore((s) => s.setNote)
  const setLlmStatus = useNotesStore((s) => s.setLlmStatus)
  const setActiveProvider = useNotesStore((s) => s.setActiveProvider)
  const setGeminiApiKey = useNotesStore((s) => s.setGeminiApiKey)
  const setVillainName = useNotesStore((s) => s.setVillainName)
  const reset = useNotesStore((s) => s.reset)

  const historyStore = useNoteHistoryStore()
  const existingVillainNote = villainName.trim()
    ? historyStore.notes.find(
        (n) => n.villainName?.toLowerCase() === villainName.trim().toLowerCase(),
      )
    : undefined

  const navigate = useNavigate()
  const [analyzeStatus, setAnalyzeStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [analyzeWarnings, setAnalyzeWarnings] = useState<string[]>([])

  // Sync provider config from persisted history store on mount
  useEffect(() => {
    const persisted = useNoteHistoryStore.getState()
    setActiveProvider(persisted.activeProvider)
    setGeminiApiKey(persisted.geminiApiKey)
  }, [setActiveProvider, setGeminiApiKey])

  const handleAnalyze = useCallback(async () => {
    if (!imageDataUrl || !ocrText) return
    setAnalyzeStatus('loading')
    setAnalyzeWarnings([])

    try {
      const img = await loadImage(imageDataUrl)
      const [cardResult, posResult] = await Promise.all([
        detectBoardCards(img),
        Promise.resolve(parsePositions(ocrText)),
      ])

      const warnings = [...cardResult.warnings, ...posResult.warnings]
      setAnalyzeWarnings(warnings)

      const store = useAnalyzerStore.getState()
      if (cardResult.cards.length > 0) store.setBoard(cardResult.cards)
      if (posResult.oopPosition) store.setOopPosition(posResult.oopPosition)
      if (posResult.ipPosition) store.setIpPosition(posResult.ipPosition)
      if (posResult.potType) store.setPotType(posResult.potType)

      setAnalyzeStatus('idle')
      void navigate({ to: '/analyze' })
    } catch {
      setAnalyzeStatus('error')
    }
  }, [imageDataUrl, ocrText, navigate])

  const runOcr = useCallback(() => {
    if (!imageDataUrl) return

    setOcrStatus('loading')

    void (async () => {
      try {
        const img = await loadImage(imageDataUrl)
        const preprocessed = preprocessForOcr(img, {
          ...GGPOKER_PRESET,
          region: regionConfig,
        })
        const text = await recognizeText(preprocessed)

        if (!text.trim()) {
          setOcrStatus('error', "Couldn't extract text. Make sure the hand history is visible and readable.")
          return
        }

        setOcrText(text.trim())
        setOcrStatus('done')
      } catch (err) {
        setOcrStatus('error', friendlyError(err))
      }
    })()
  }, [imageDataUrl, regionConfig, setOcrText, setOcrStatus])

  // Auto-run OCR when a new image is set
  useEffect(() => {
    if (!imageDataUrl) return
    runOcr()
  }, [imageDataUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateNote = useCallback(() => {
    if (!ocrText.trim()) return

    if (!navigator.onLine) {
      setLlmStatus('error', 'You\'re offline. Connect to the internet and try again.')
      return
    }

    if (activeProvider === 'gemini' && !geminiApiKey.trim()) {
      setLlmStatus('error', 'Enter a Gemini API key to use this provider.')
      return
    }

    setLlmStatus('loading')
    void generateNoteWithProvider(ocrText, activeProvider, geminiApiKey).then(
      (note) => {
        setNote(note)
        setLlmStatus('done')

        // Auto-save to history
        const trimmedVillain = villainName.trim()
        if (trimmedVillain && existingVillainNote) {
          useNoteHistoryStore.getState().appendToVillain(trimmedVillain, note, ocrText)
        } else {
          useNoteHistoryStore.getState().addNote({
            id: crypto.randomUUID(),
            note,
            ocrText,
            createdAt: Date.now(),
            villainName: trimmedVillain || undefined,
          })
        }
      },
      (err: unknown) => {
        setLlmStatus('error', friendlyError(err))
      },
    )
  }, [ocrText, activeProvider, geminiApiKey, villainName, existingVillainNote, setNote, setLlmStatus])

  const handleProviderChange = useCallback(
    (value: string) => {
      const provider = value as LlmProviderId
      setActiveProvider(provider)
      useNoteHistoryStore.getState().setActiveProvider(provider)
    },
    [setActiveProvider],
  )

  const handleApiKeyChange = useCallback(
    (key: string) => {
      setGeminiApiKey(key)
      useNoteHistoryStore.getState().setGeminiApiKey(key)
    },
    [setGeminiApiKey],
  )

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-200">
          Hand History Notes
        </h2>
        {imageDataUrl && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear
          </Button>
        )}
      </div>

      <ScreenshotInput />

      <PreprocessPreview />

      {imageDataUrl && ocrStatus !== 'loading' && (
        <Button variant="outline" size="sm" onClick={runOcr}>
          Re-run OCR
        </Button>
      )}

      <OcrPreview onRetry={runOcr} />

      {ocrStatus === 'done' && (
        <>
          {/* Provider selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Select value={activeProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDER_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {LLM_PROVIDER_LABELS[id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Villain name input */}
              <Input
                placeholder="Villain name (optional)"
                value={villainName}
                onChange={(e) => setVillainName(e.target.value)}
                className="flex-1"
              />
            </div>

            {activeProvider === 'gemini' && (
              <Input
                type="password"
                placeholder="Gemini API key"
                value={geminiApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateNote}
              disabled={!ocrText.trim() || llmStatus === 'loading'}
            >
              {llmStatus === 'loading'
                ? 'Generating...'
                : existingVillainNote
                  ? `Append Note for ${villainName.trim()}`
                  : 'Generate Note'}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleAnalyze()}
              disabled={!ocrText.trim() || analyzeStatus === 'loading'}
            >
              {analyzeStatus === 'loading' ? 'Detecting...' : 'Analyze Hand'}
            </Button>
          </div>
        </>
      )}

      {analyzeStatus === 'error' && (
        <p className="text-sm text-red-400">Card/position detection failed. You can still use the analyzer manually.</p>
      )}

      {analyzeWarnings.length > 0 && (
        <div className="text-sm text-yellow-400 space-y-1">
          {analyzeWarnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      <NoteResult onRetry={handleGenerateNote} />

      <NoteHistory />
    </div>
  )
}
