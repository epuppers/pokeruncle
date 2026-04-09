import type { PreprocessConfig } from './preprocessing.types'

/** Tuned for GGPoker hand replay screenshots (light text on dark background) */
export const GGPOKER_PRESET: PreprocessConfig = {
  region: { x: 0, y: 0.55, width: 1, height: 0.45 },
  scale: 2,
  threshold: 100,
  invert: true,
}

/** No preprocessing — full image with standard threshold (M1 behavior) */
export const FULL_IMAGE_PRESET: PreprocessConfig = {
  region: null,
  scale: 1,
  threshold: 128,
  invert: false,
}
