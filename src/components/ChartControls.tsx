import { useRef } from 'react'
import { useChartStore } from '@/stores/chartStore'
import { type Position } from '@/types/poker'
import { cn } from '@/lib/utils'
import { POSITION_LABELS } from '@/lib/poker-glossary'

// Custom order: UTG, MP, CO (top row), BB, SB, BTN (bottom row)
const POSITION_ORDER: Position[] = ['UTG', 'MP', 'CO', 'BB', 'SB', 'BTN']

interface PositionGridProps {
  label: string
  selected: Position | null
  onSelect: (p: Position) => void
  disabled?: Position[]
}

function PositionGrid({ label, selected, onSelect, disabled = [] }: PositionGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
        nextIndex = index + 1
        break
      case 'ArrowLeft':
        nextIndex = index - 1
        break
      case 'ArrowDown':
        nextIndex = index + 3
        break
      case 'ArrowUp':
        nextIndex = index - 3
        break
      default:
        return
    }

    if (nextIndex === null || nextIndex < 0 || nextIndex >= POSITION_ORDER.length) return
    e.preventDefault()

    const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>('button')
    buttons?.[nextIndex]?.focus()
  }

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={label}>
      <span className="text-muted-foreground text-xs uppercase tracking-wide text-center">{label}</span>
      <div ref={gridRef} className="grid grid-cols-3 gap-1.5">
        {POSITION_ORDER.map((p, i) => {
          const isDisabled = disabled.includes(p)
          const isSelected = selected === p
          const isDealer = p === 'BTN'
          const entry = POSITION_LABELS[p]
          return (
            <button
              key={p}
              onClick={() => !isDisabled && onSelect(p)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              title={entry.tip}
              className={cn(
                'relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                isDisabled && 'opacity-30 cursor-not-allowed',
                isDealer && !isSelected && !isDisabled && 'ring-2 ring-brass/50',
                isSelected
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25'
                  : !isDisabled && 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {entry.label}
              {isDealer && (
                <span aria-label="Dealer" className="absolute -top-1 -right-1 w-4 h-4 bg-brass rounded-full text-[9px] font-bold text-primary-foreground flex items-center justify-center shadow">
                  D
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ChartControls() {
  const { position, villain, setPosition, setVillain } = useChartStore()

  // Villain must be different from hero
  const disabledVillains = [position]

  return (
    <div className="flex items-start justify-center gap-8">
      <PositionGrid
        label="Your seat"
        selected={position}
        onSelect={setPosition}
      />
      <PositionGrid
        label="Opponent's seat"
        selected={villain}
        onSelect={setVillain}
        disabled={disabledVillains}
      />
    </div>
  )
}
