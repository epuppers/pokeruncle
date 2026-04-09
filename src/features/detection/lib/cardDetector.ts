import type { Card, Rank, Suit } from '@/types/poker'
import { RANKS, SUITS } from '@/types/poker'
import { cropToRegion } from '@/features/notes/lib/imagePreprocessor'
import { BOARD_CARD_REGION } from './regionConfigs'

export interface DetectedCard {
  card: Card
  confidence: number
  x: number
}

export interface CardDetectionResult {
  cards: Card[]
  detections: DetectedCard[]
  warnings: string[]
}

/** Minimum confidence (0-1) to accept a card match */
const CONFIDENCE_THRESHOLD = 0.85

/** Horizontal step size in pixels when sliding template */
const SLIDE_STEP = 4

/** Vertical offsets to try (handles slight vertical misalignment) */
const Y_OFFSETS = [-6, -3, 0, 3, 6]

/** Overlap threshold for NMS (fraction of template width) */
const NMS_OVERLAP = 0.5

// Module-level template cache
let templateCache: Map<string, ImageData> | null = null

/**
 * Build the key for a card template: e.g. "A_s", "7_h"
 */
function templateKey(rank: Rank, suit: Suit): string {
  return `${rank}_${suit}`
}

/**
 * Load a single image from a URL and return an HTMLImageElement.
 */
function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load template: ${url}`))
    img.src = url
  })
}

/**
 * Load all 52 card template PNGs from /card-templates/ and extract ImageData.
 * Caches the result so subsequent calls are instant.
 */
export async function loadTemplates(): Promise<Map<string, ImageData>> {
  if (templateCache) return templateCache

  const templates = new Map<string, ImageData>()
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas 2d context')

  const loadPromises: Promise<void>[] = []

  for (const rank of RANKS) {
    for (const suit of SUITS) {
      const key = templateKey(rank, suit)
      const url = `/card-templates/${key}.png`

      loadPromises.push(
        loadImg(url).then((img) => {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          templates.set(key, ctx.getImageData(0, 0, canvas.width, canvas.height))
        })
      )
    }
  }

  const results = await Promise.allSettled(loadPromises)
  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length === 52) {
    throw new Error('No card templates found. Add 52 PNG files to public/card-templates/')
  }

  templateCache = templates
  return templates
}

/**
 * Compute normalized Sum of Absolute Differences between a template and
 * a region of the source image at a given (x, y) offset.
 *
 * Returns a similarity score 0-1 where 1 = perfect match.
 */
export function computeSimilarity(
  srcData: Uint8ClampedArray,
  srcWidth: number,
  tplData: Uint8ClampedArray,
  tplWidth: number,
  tplHeight: number,
  offsetX: number,
  offsetY: number
): number {
  let sad = 0
  let pixelCount = 0

  for (let ty = 0; ty < tplHeight; ty++) {
    const sy = offsetY + ty
    for (let tx = 0; tx < tplWidth; tx++) {
      const sx = offsetX + tx

      const si = (sy * srcWidth + sx) * 4
      const ti = (ty * tplWidth + tx) * 4

      // Compare RGB channels (skip alpha)
      sad += Math.abs(srcData[si] - tplData[ti])
      sad += Math.abs(srcData[si + 1] - tplData[ti + 1])
      sad += Math.abs(srcData[si + 2] - tplData[ti + 2])
      pixelCount++
    }
  }

  // Normalize: max SAD per pixel is 255*3 = 765
  const maxSad = pixelCount * 765
  return maxSad > 0 ? 1 - sad / maxSad : 0
}

interface MatchResult {
  x: number
  score: number
}

/**
 * Slide a template across the source image horizontally, trying several
 * y-offsets. Returns positions where similarity exceeds threshold.
 */
function slidingWindowMatch(
  srcImageData: ImageData,
  tplImageData: ImageData
): MatchResult[] {
  const srcW = srcImageData.width
  const srcH = srcImageData.height
  const tplW = tplImageData.width
  const tplH = tplImageData.height

  if (tplW > srcW || tplH > srcH) return []

  const matches: MatchResult[] = []
  const maxX = srcW - tplW
  const centerY = Math.floor((srcH - tplH) / 2)

  for (let x = 0; x <= maxX; x += SLIDE_STEP) {
    let bestScore = 0

    for (const yOff of Y_OFFSETS) {
      const y = centerY + yOff
      if (y < 0 || y + tplH > srcH) continue

      const score = computeSimilarity(
        srcImageData.data,
        srcW,
        tplImageData.data,
        tplW,
        tplH,
        x,
        y
      )

      if (score > bestScore) bestScore = score
    }

    if (bestScore >= CONFIDENCE_THRESHOLD) {
      matches.push({ x, score: bestScore })
    }
  }

  return matches
}

/**
 * Non-maximum suppression: for overlapping detections at similar x-positions,
 * keep only the one with the highest confidence.
 */
export function nonMaxSuppression(detections: DetectedCard[], tplWidth: number): DetectedCard[] {
  // Sort by confidence descending
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence)
  const kept: DetectedCard[] = []
  const overlapDist = tplWidth * NMS_OVERLAP

  for (const det of sorted) {
    const overlaps = kept.some((k) => Math.abs(k.x - det.x) < overlapDist)
    if (!overlaps) {
      kept.push(det)
    }
  }

  return kept
}

/**
 * Detect board cards from a GGPoker screenshot using template matching.
 *
 * 1. Crops to the board card region
 * 2. Loads 52 card templates (cached)
 * 3. Slides each template across the region
 * 4. Applies non-maximum suppression
 * 5. Returns 0-5 cards sorted left-to-right
 */
export async function detectBoardCards(
  image: HTMLImageElement
): Promise<CardDetectionResult> {
  const warnings: string[] = []

  // Crop to board region
  const regionCanvas = cropToRegion(image, BOARD_CARD_REGION)
  const regionCtx = regionCanvas.getContext('2d')
  if (!regionCtx) throw new Error('Failed to get canvas 2d context')
  const regionData = regionCtx.getImageData(0, 0, regionCanvas.width, regionCanvas.height)

  // Load templates
  let templates: Map<string, ImageData>
  try {
    templates = await loadTemplates()
  } catch (err) {
    return {
      cards: [],
      detections: [],
      warnings: [err instanceof Error ? err.message : 'Failed to load card templates'],
    }
  }

  if (templates.size === 0) {
    return { cards: [], detections: [], warnings: ['No card templates loaded'] }
  }

  // Get template dimensions from the first template
  const firstTemplate = templates.values().next().value!
  const tplWidth = firstTemplate.width

  // Match each template against the board region
  const allDetections: DetectedCard[] = []

  for (const [key, tplData] of templates) {
    const matches = slidingWindowMatch(regionData, tplData)

    // Parse key back to Card
    const [rank, suit] = key.split('_') as [Rank, Suit]
    const card: Card = { rank, suit }

    for (const match of matches) {
      allDetections.push({
        card,
        confidence: match.score,
        x: match.x,
      })
    }
  }

  // Non-maximum suppression
  const filtered = nonMaxSuppression(allDetections, tplWidth)

  // Sort left-to-right (flop1, flop2, flop3, turn, river)
  filtered.sort((a, b) => a.x - b.x)

  // Limit to 5 cards max
  const final = filtered.slice(0, 5)

  if (final.length === 0) {
    warnings.push('No board cards detected')
  } else if (final.length < 3) {
    warnings.push(`Only ${final.length} card(s) detected — need at least 3 for flop analysis`)
  }

  // Check for low confidence detections
  for (const det of final) {
    if (det.confidence < 0.9) {
      warnings.push(`Low confidence (${(det.confidence * 100).toFixed(0)}%) on ${det.card.rank}${det.card.suit}`)
    }
  }

  return {
    cards: final.map((d) => d.card),
    detections: final,
    warnings,
  }
}
