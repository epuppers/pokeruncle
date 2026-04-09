import { cn } from '@/lib/utils'

import { useNotesStore } from '../store'

export function OcrPreview() {
  const ocrText = useNotesStore((s) => s.ocrText)
  const ocrStatus = useNotesStore((s) => s.ocrStatus)
  const ocrError = useNotesStore((s) => s.ocrError)
  const setOcrText = useNotesStore((s) => s.setOcrText)

  if (ocrStatus === 'idle') return null

  if (ocrStatus === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-neutral-900 p-4 text-sm text-neutral-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
        Extracting text from screenshot...
      </div>
    )
  }

  if (ocrStatus === 'error') {
    return (
      <div className="rounded-lg bg-red-950/50 p-4 text-sm text-red-400">
        {ocrError ?? "Couldn't extract text. Make sure the hand history is visible and readable."}
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
