import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'

import { useNoteHistoryStore } from '../historyStore'

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NoteHistory() {
  const notes = useNoteHistoryStore((s) => s.notes)
  const deleteNote = useNoteHistoryStore((s) => s.deleteNote)
  const clearHistory = useNoteHistoryStore((s) => s.clearHistory)
  const [expanded, setExpanded] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = useCallback((id: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }, [])

  if (notes.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-400 hover:text-neutral-300"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
        Recent Notes ({notes.length})
      </button>

      {expanded && (
        <div className="flex flex-col gap-2">
          {notes.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg bg-neutral-900 p-3"
            >
              <div className="flex-1 min-w-0">
                {entry.villainName && (
                  <span className="text-xs font-medium text-neutral-500">
                    {entry.villainName}
                  </span>
                )}
                <p className="truncate font-mono text-sm text-neutral-100">
                  {entry.note}
                </p>
                <span className="text-xs text-neutral-500">
                  {timeAgo(entry.createdAt)}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(entry.id, entry.note)}
                  className="h-7 px-2 text-xs"
                >
                  {copiedId === entry.id ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote(entry.id)}
                  className="h-7 px-2 text-xs text-neutral-500 hover:text-red-400"
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="self-start text-xs text-neutral-500 hover:text-red-400"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
