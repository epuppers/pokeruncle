interface RollDisplayProps {
  rolledNumber: number
}

export function RollDisplay({ rolledNumber }: RollDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
      <span>You rolled:</span>
      <span className="text-xl font-bold tabular-nums text-amber-400">
        {rolledNumber}
      </span>
    </div>
  )
}
