import { Button } from '@/components/ui/button'

interface OnboardingStepProps {
  title: string
  children: React.ReactNode
  buttonLabel: string
  onNext: () => void
  step: number
  totalSteps: number
}

export function OnboardingStep({ title, children, buttonLabel, onNext, step, totalSteps }: OnboardingStepProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-md mx-auto">
      {/* Step indicator */}
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i <= step ? 'bg-brass' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Title */}
      <h2 className="font-display text-2xl font-bold text-brass">{title}</h2>

      {/* Content */}
      <div className="w-full space-y-4">{children}</div>

      {/* Next button */}
      <Button onClick={onNext} size="lg" className="min-w-[160px]">
        {buttonLabel}
      </Button>
    </div>
  )
}
