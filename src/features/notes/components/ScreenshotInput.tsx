import { useCallback, useRef } from 'react'

import { cn } from '@/lib/utils'

import { useNotesStore } from '../store'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function ScreenshotInput() {
  const setImage = useNotesStore((s) => s.setImage)
  const imageDataUrl = useNotesStore((s) => s.imageDataUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      const dataUrl = await readFileAsDataUrl(file)
      setImage(dataUrl)
    },
    [setImage]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) void handleImage(file)
          return
        }
      }
    },
    [handleImage]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) void handleImage(file)
    },
    [handleImage]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void handleImage(file)
    },
    [handleImage]
  )

  return (
    <div
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      tabIndex={0}
      className={cn(
        'relative rounded-lg border-2 border-dashed border-neutral-700 p-6',
        'transition-colors hover:border-neutral-500 focus:border-sky-500 focus:outline-none',
        'cursor-pointer text-center',
        imageDataUrl && 'border-solid border-neutral-700'
      )}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {imageDataUrl ? (
        <img
          src={imageDataUrl}
          alt="Screenshot preview"
          className="mx-auto max-h-64 rounded"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
          <p className="text-sm font-medium">
            Paste screenshot (Cmd+V), drag & drop, or click to upload
          </p>
          <p className="text-xs text-neutral-500">
            PNG, JPG, WebP supported
          </p>
        </div>
      )}
    </div>
  )
}
