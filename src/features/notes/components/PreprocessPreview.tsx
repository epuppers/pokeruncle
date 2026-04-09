import { useEffect, useMemo, useState } from 'react'

import { useNotesStore } from '../store'
import { loadImage, preprocessForOcr } from '../lib/imagePreprocessor'
import { GGPOKER_PRESET } from '../lib/presets'

export function PreprocessPreview() {
  const imageDataUrl = useNotesStore((s) => s.imageDataUrl)
  const regionConfig = useNotesStore((s) => s.regionConfig)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const shouldGenerate = useMemo(
    () => Boolean(imageDataUrl && open),
    [imageDataUrl, open]
  )

  useEffect(() => {
    if (!shouldGenerate || !imageDataUrl) return

    let cancelled = false
    void loadImage(imageDataUrl).then((img) => {
      if (cancelled) return
      const canvas = preprocessForOcr(img, {
        ...GGPOKER_PRESET,
        region: regionConfig,
      })
      setPreviewUrl(canvas.toDataURL())
    })
    return () => {
      cancelled = true
      setPreviewUrl(null)
    }
  }, [shouldGenerate, imageDataUrl, regionConfig])

  if (!imageDataUrl) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        {open ? 'Hide' : 'Show'} preprocessed image
      </button>

      {open && previewUrl && (
        <div className="mt-2 rounded-lg border border-neutral-700 bg-neutral-900 p-2">
          <img
            src={previewUrl}
            alt="Preprocessed for OCR"
            className="mx-auto max-h-48 rounded"
          />
          <p className="mt-1 text-center text-xs text-neutral-500">
            This is what Tesseract sees after cropping, scaling, and binarization
          </p>
        </div>
      )}
    </div>
  )
}
