import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'

import { useNotesStore } from '../store'

export function NoteResult() {
  const note = useNotesStore((s) => s.note)
  const llmStatus = useNotesStore((s) => s.llmStatus)
  const llmError = useNotesStore((s) => s.llmError)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(note).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [note])

  if (llmStatus === 'idle') return null

  if (llmStatus === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-neutral-900 p-4 text-sm text-neutral-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
        Generating player note...
      </div>
    )
  }

  if (llmStatus === 'error') {
    return (
      <div className="rounded-lg bg-red-950/50 p-4 text-sm text-red-400">
        {llmError ?? 'Failed to generate note. Try again.'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        Player Note
      </label>
      <div className="flex items-start gap-3 rounded-lg bg-neutral-900 p-4">
        <p className="flex-1 font-mono text-sm text-neutral-100">{note}</p>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}
