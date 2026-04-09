import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { useNotesStore } from '../store'
import { useProgressMessages } from '../lib/useProgressMessages'

const OCR_MESSAGES = [
  'Initializing OCR engine...',
  'Extracting text from screenshot...',
  'Still working... (first run takes longer)',
]
const OCR_DELAYS = [1000, 3000]

interface OcrPreviewProps {
  onRetry?: () => void
}

export function OcrPreview({ onRetry }: OcrPreviewProps) {
  const ocrText = useNotesStore((s) => s.ocrText)
  const ocrStatus = useNotesStore((s) => s.ocrStatus)
  const ocrError = useNotesStore((s) => s.ocrError)
  const setOcrText = useNotesStore((s) => s.setOcrText)

  const loadingMessage = useProgressMessages(
    ocrStatus === 'loading',
    OCR_MESSAGES,
    OCR_DELAYS,
  )

  if (ocrStatus === 'idle') return null

  if (ocrStatus === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-neutral-900 p-4 text-sm text-neutral-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
        {loadingMessage}
      </div>
    )
  }

  if (ocrStatus === 'error') {
    return (
      <div className="flex items-center justify-between rounded-lg bg-red-950/50 p-4 text-sm text-red-400">
        <span>{ocrError ?? "Couldn't extract text. Make sure the hand history is visible and readable."}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="text-red-400 hover:text-red-300">
            Retry
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        OCR Result (editable)
      </label>
      <textarea
        value={ocrText}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOcrText(e.target.value)}
        rows={8}
        className={cn(
          'w-full resize-y rounded-lg bg-neutral-900 p-3 text-sm text-neutral-200',
          'border border-neutral-700 focus:border-sky-500 focus:outline-none',
          'font-mono leading-relaxed'
        )}
      />
    </div>
  )
}
