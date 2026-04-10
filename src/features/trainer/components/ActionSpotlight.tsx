import { cn } from '@/lib/utils'
import type { Position } from '@/types/poker'

import { POSITION_COORDS } from '@/features/trainer/lib/chip-positions'
import type { DealingStep } from '@/features/trainer/lib/action-sequence'

interface ActionSpotlightProps {
  /** Current position the spotlight is on */
  position: Position
  /** Style of the current step (hero gets a special glow) */
  stepStyle: DealingStep['style']
  /** Whether the spotlight is visible */
  visible: boolean
}

/**
 * A glowing ring that smoothly CSS-transitions between seat positions
 * during the dealing sequence. Gives the feel of action moving around the table.
 */
export function ActionSpotlight({ position, stepStyle, visible }: ActionSpotlightProps) {
  const coords = POSITION_COORDS[position]
  const isHero = stepStyle === 'hero'

  return (
    <div
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0',
        'w-16 h-16 rounded-full',
        'transition-[left,top,opacity,transform,box-shadow] duration-500 ease-in-out',
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-50',
        isHero && 'animate-[spotlightPulse_1.5s_ease-in-out_infinite]',
      )}
      style={{
        left: `${coords.x}%`,
        top: `${coords.y}%`,
        boxShadow: isHero
          ? '0 0 32px 12px oklch(0.75 0.12 85 / 0.5), inset 0 0 12px oklch(1 0 0 / 0.1)'
          : '0 0 24px 8px oklch(0.75 0.12 85 / 0.3), inset 0 0 8px oklch(1 0 0 / 0.08)',
        border: '2px solid var(--brass)',
      }}
    />
  )
}
