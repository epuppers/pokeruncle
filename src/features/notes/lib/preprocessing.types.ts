/** Fractional crop region (0-1 coordinates, resolution-independent) */
export interface RegionConfig {
  /** Left edge as fraction of image width (0-1) */
  x: number
  /** Top edge as fraction of image height (0-1) */
  y: number
  /** Width as fraction of image width (0-1) */
  width: number
  /** Height as fraction of image height (0-1) */
  height: number
}

/** Configuration for the image preprocessing pipeline */
export interface PreprocessConfig {
  /** Region to crop before OCR. null = full image */
  region: RegionConfig | null
  /** Upscale factor before OCR (1 = no scaling, 2 = double) */
  scale: number
  /** Binary threshold value (0-255). Pixels above this become white. */
  threshold: number
  /** Invert after thresholding (for light text on dark background) */
  invert: boolean
}
