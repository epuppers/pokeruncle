/**
 * Canvas-based image preprocessing for OCR.
 * Converts to grayscale and applies threshold to improve Tesseract accuracy.
 */
export function preprocessForOcr(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas 2d context')

  // Draw original image
  ctx.drawImage(image, 0, 0)

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  // Convert to grayscale and apply threshold for binarization
  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

    // Binarize with a threshold — tune this for GGPoker screenshots
    const binary = gray > 128 ? 255 : 0

    data[i] = binary
    data[i + 1] = binary
    data[i + 2] = binary
    // Alpha stays unchanged
  }

  ctx.putImageData(imageData, 0, 0)
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
