interface RollDisplayProps {
  rolledNumber: number
}

export function RollDisplay({ rolledNumber }: RollDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <span>Your number:</span>
      <span className="font-display text-xl font-bold tabular-nums text-brass">
        {rolledNumber}
      </span>
      <span className="text-xs opacity-60">— this picks the action when the strategy is mixed</span>
    </div>
  )
}
