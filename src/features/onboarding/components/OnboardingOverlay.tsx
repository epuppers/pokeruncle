import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Spade } from 'lucide-react'

import { useSettingsStore } from '@/stores/settingsStore'

import { OnboardingStep } from './OnboardingStep'
import { StrategyExplainer } from './StrategyExplainer'

const TOTAL_STEPS = 3

export function OnboardingOverlay() {
  const [step, setStep] = useState(0)
  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete)
  const navigate = useNavigate()

  function handleComplete() {
    setOnboardingComplete()
    void navigate({ to: '/train' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        {step === 0 && (
          <OnboardingStep
            title="Welcome to Uncle's Table"
            buttonLabel="Let's Go"
            onNext={() => setStep(1)}
            step={0}
            totalSteps={TOTAL_STEPS}
          >
            <div className="flex justify-center">
              <Spade className="size-16 text-brass fill-brass/20" />
            </div>
            <p className="text-foreground/80">
              This is a poker training tool that helps you learn which hands to play
              and how to play them. You'll practice making decisions and get instant feedback.
            </p>
            <p className="text-sm text-muted-foreground">
              No money involved — just you, some cards, and the best strategy to learn.
            </p>
          </OnboardingStep>
        )}

        {step === 1 && (
          <OnboardingStep
            title="How Mixed Strategies Work"
            buttonLabel="Makes Sense"
            onNext={() => setStep(2)}
            step={1}
            totalSteps={TOTAL_STEPS}
          >
            <p className="text-foreground/80">
              Sometimes the best poker strategy means doing different things with the same hand.
              For example, you might raise 60% of the time and fold 40%.
            </p>
            <StrategyExplainer rollNumber={73} />
            <p className="text-sm text-muted-foreground">
              The trainer rolls a random number each time to decide which action is correct.
              This way you learn the right mix, not just one answer.
            </p>
          </OnboardingStep>
        )}

        {step === 2 && (
          <OnboardingStep
            title="Ready to Play"
            buttonLabel="Start Training"
            onNext={handleComplete}
            step={2}
            totalSteps={TOTAL_STEPS}
          >
            <p className="text-foreground/80">
              You'll see a poker table with your hand in the center. Choose your action
              using the buttons or keyboard shortcuts (1, 2, 3, 4).
            </p>
            <div className="rounded-lg bg-card/50 border border-border p-4 text-left space-y-2">
              <div className="flex items-center gap-3">
                <kbd className="rounded-sm bg-secondary px-2 py-1 font-mono text-sm shadow-[0_1px_0_rgba(0,0,0,0.3)]">1</kbd>
                <span className="text-sm text-foreground">Fold — give up your hand</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="rounded-sm bg-secondary px-2 py-1 font-mono text-sm shadow-[0_1px_0_rgba(0,0,0,0.3)]">2</kbd>
                <span className="text-sm text-foreground">Call — match the bet</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="rounded-sm bg-secondary px-2 py-1 font-mono text-sm shadow-[0_1px_0_rgba(0,0,0,0.3)]">3</kbd>
                <span className="text-sm text-foreground">Raise — increase the bet</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="rounded-sm bg-secondary px-2 py-1 font-mono text-sm shadow-[0_1px_0_rgba(0,0,0,0.3)]">4</kbd>
                <span className="text-sm text-foreground">All-in — bet everything</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              After each hand, press <kbd className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono shadow-[0_1px_0_rgba(0,0,0,0.3)]">Space</kbd> to move to the next one.
            </p>
          </OnboardingStep>
        )}
      </div>
    </div>
  )
}
