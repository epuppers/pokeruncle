import { useState, useEffect, useCallback } from 'react'

import { cn } from '@/lib/utils'

interface KeyBindingEditorProps {
  action: string
  label: string
  currentKey: string
  onKeyChange: (key: string) => void
}

function displayKey(key: string): string {
  if (key === ' ') return 'Space'
  if (key === 'Enter') return 'Enter'
  return key.toUpperCase()
}

export function KeyBindingEditor({ action, label, currentKey, onKeyChange }: KeyBindingEditorProps) {
  const [isCapturing, setIsCapturing] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isCapturing) return
      e.preventDefault()
      e.stopPropagation()

      // Ignore modifier-only keys
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return

      onKeyChange(e.key)
      setIsCapturing(false)
    },
    [isCapturing, onKeyChange],
  )

  useEffect(() => {
    if (isCapturing) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCapturing, handleKeyDown])

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        aria-label={`Rebind ${action}`}
        onClick={() => setIsCapturing(!isCapturing)}
        className={cn(
          'min-w-[60px] rounded-md px-3 py-1.5 text-sm font-mono font-medium transition-colors',
          'border shadow-[0_1px_0_rgba(0,0,0,0.3)]',
          isCapturing
            ? 'border-brass bg-brass/20 text-brass animate-pulse'
            : 'border-border bg-secondary text-foreground hover:bg-secondary/80',
        )}
      >
        {isCapturing ? 'Press a key...' : displayKey(currentKey)}
      </button>
    </div>
  )
}
