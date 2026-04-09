import { useEffect, useState } from 'react'

/**
 * Returns a timed loading message that progresses through stages.
 * Uses a counter incremented by timers, reset derived from isActive.
 */
export function useProgressMessages(
  isActive: boolean,
  messages: string[],
  delays: number[],
): string {
  // Track how many transitions have fired
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!isActive) return

    // Schedule each transition
    let elapsed = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < delays.length && i < messages.length - 1; i++) {
      elapsed += delays[i]
      const nextStep = i + 1
      timers.push(setTimeout(() => setStep(nextStep), elapsed))
    }

    return () => {
      timers.forEach(clearTimeout)
      setStep(0)
    }
  }, [isActive, messages.length, delays])

  if (!isActive) return messages[0]
  return messages[step] ?? messages[0]
}
