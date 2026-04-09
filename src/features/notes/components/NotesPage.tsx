import { useCallback, useEffect } from 'react'

import { Button } from '@/components/ui/button'

import { useNotesStore } from '../store'
import { loadImage, preprocessForOcr } from '../lib/imagePreprocessor'
import { recognizeText } from '../lib/tesseractWorker'
import { generateNote } from '../lib/llm7Client'
import { GGPOKER_PRESET } from '../lib/presets'
import { ScreenshotInput } from './ScreenshotInput'
import { PreprocessPreview } from './PreprocessPreview'
import { OcrPreview } from './OcrPreview'
import { NoteResult } from './NoteResult'

export function NotesPage() {
  const imageDataUrl = useNotesStore((s) => s.imageDataUrl)
  const ocrText = useNotesStore((s) => s.ocrText)
  const ocrStatus = useNotesStore((s) => s.ocrStatus)
  const llmStatus = useNotesStore((s) => s.llmStatus)
  const regionConfig = useNotesStore((s) => s.regionConfig)
  const setOcrText = useNotesStore((s) => s.setOcrText)
  const setOcrStatus = useNotesStore((s) => s.setOcrStatus)
  const setNote = useNotesStore((s) => s.setNote)
  const setLlmStatus = useNotesStore((s) => s.setLlmStatus)
  const reset = useNotesStore((s) => s.reset)

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
        const message = err instanceof Error ? err.message : 'OCR failed'
        setOcrStatus('error', message)
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
    setLlmStatus('loading')
    void generateNote(ocrText).then(
      (note) => {
        setNote(note)
        setLlmStatus('done')
      },
      (err: unknown) => {
        const message = err instanceof Error ? err.message : 'LLM request failed'
        setLlmStatus('error', message)
      }
    )
  }, [ocrText, setNote, setLlmStatus])

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

      <OcrPreview />

      {ocrStatus === 'done' && (
        <Button
          onClick={handleGenerateNote}
          disabled={!ocrText.trim() || llmStatus === 'loading'}
        >
          {llmStatus === 'loading' ? 'Generating...' : 'Generate Note'}
        </Button>
      )}

      <NoteResult />
    </div>
  )
}
