import type Tesseract from 'tesseract.js'

let workerPromise: Promise<Tesseract.Worker> | null = null

/**
 * Lazily initialize a Tesseract worker. Reuses the same worker across calls.
 * Loads Russian + English language data for GGPoker hand histories.
 */
function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then((mod) =>
      mod.createWorker(['rus', 'eng'])
    )
  }
  return workerPromise
}

/**
 * Run OCR on an image (canvas, img element, or data URL).
 * Returns the extracted text.
 */
export async function recognizeText(
  image: Tesseract.ImageLike
): Promise<string> {
  const worker = await getWorker()
  const result = await worker.recognize(image)
  return result.data.text
}

/**
 * Terminate the Tesseract worker to free resources.
 */
export async function terminateWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise
    await worker.terminate()
    workerPromise = null
  }
}
