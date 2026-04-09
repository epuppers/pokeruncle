import { useCallback, useEffect } from 'react'

import { Button } from '@/components/ui/button'

import { useNotesStore } from '../store'
import { loadImage, preprocessForOcr } from '../lib/imagePreprocessor'
import { recognizeText } from '../lib/tesseractWorker'
import { generateNote } from '../lib/llm7Client'
import { ScreenshotInput } from './ScreenshotInput'
import { OcrPreview } from './OcrPreview'
import { NoteResult } from './NoteResult'

export function NotesPage() {
  const imageDataUrl = useNotesStore((s) => s.imageDataUrl)
  const ocrText = useNotesStore((s) => s.ocrText)
  const ocrStatus = useNotesStore((s) => s.ocrStatus)
  const llmStatus = useNotesStore((s) => s.llmStatus)
  const setOcrText = useNotesStore((s) => s.setOcrText)
  const setOcrStatus = useNotesStore((s) => s.setOcrStatus)
  const setNote = useNotesStore((s) => s.setNote)
  const setLlmStatus = useNotesStore((s) => s.setLlmStatus)
  const reset = useNotesStore((s) => s.reset)

  // Run OCR when a new image is set
  useEffect(() => {
    if (!imageDataUrl) return

    let cancelled = false

    async function runOcr() {
      setOcrStatus('loading')
      try {
        const img = await loadImage(imageDataUrl!)
        const preprocessed = preprocessForOcr(img)
        const text = await recognizeText(preprocessed)

        if (cancelled) return

        if (!text.trim()) {
          setOcrStatus('error', "Couldn't extract text. Make sure the hand history is visible and readable.")
          return
        }

        setOcrText(text.trim())
        setOcrStatus('done')
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'OCR failed'
        setOcrStatus('error', message)
      }
    }

    void runOcr()
    return () => { cancelled = true }
  }, [imageDataUrl, setOcrText, setOcrStatus])

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
