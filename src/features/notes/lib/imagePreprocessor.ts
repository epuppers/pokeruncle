import type { RegionConfig, PreprocessConfig } from './preprocessing.types'
import { GGPOKER_PRESET } from './presets'

/**
 * Crop an image to a fractional region, returning a new canvas.
 */
export function cropToRegion(
  image: HTMLImageElement | HTMLCanvasElement,
  region: RegionConfig
): HTMLCanvasElement {
  const srcW = image instanceof HTMLImageElement ? image.naturalWidth : image.width
  const srcH = image instanceof HTMLImageElement ? image.naturalHeight : image.height

  const sx = Math.round(region.x * srcW)
  const sy = Math.round(region.y * srcH)
  const sw = Math.round(region.width * srcW)
  const sh = Math.round(region.height * srcH)

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas 2d context')

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas
}

/**
 * Scale a canvas by a given factor. Returns a new canvas.
 */
export function scaleCanvas(
  source: HTMLCanvasElement,
  factor: number
): HTMLCanvasElement {
  if (factor === 1) return source

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.width * factor)
  canvas.height = Math.round(source.height * factor)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas 2d context')

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * Convert canvas to grayscale and apply binary threshold.
 * Mutates the canvas in place and returns it.
 */
export function binarize(
  canvas: HTMLCanvasElement,
  threshold: number,
  invert: boolean
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas 2d context')

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    let binary = gray > threshold ? 255 : 0
    if (invert) binary = 255 - binary

    data[i] = binary
    data[i + 1] = binary
    data[i + 2] = binary
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Full preprocessing pipeline: crop → scale → binarize.
 * Defaults to GGPOKER_PRESET if no config provided.
 */
export function preprocessForOcr(
  image: HTMLImageElement,
  config: PreprocessConfig = GGPOKER_PRESET
): HTMLCanvasElement {
  // Step 1: Crop to region (or draw full image)
  let canvas: HTMLCanvasElement
  if (config.region) {
    canvas = cropToRegion(image, config.region)
  } else {
    canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas 2d context')
    ctx.drawImage(image, 0, 0)
  }

  // Step 2: Scale up for better OCR on small text
  canvas = scaleCanvas(canvas, config.scale)

  // Step 3: Grayscale + binary threshold
  canvas = binarize(canvas, config.threshold, config.invert)

  return canvas
}

/**
 * Load an image from a data URL and return an HTMLImageElement.
 */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}
