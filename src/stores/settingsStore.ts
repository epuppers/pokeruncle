import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod/v4'
import { PROVIDERS } from '@/types/poker'
import type { Provider } from '@/types/poker'

type KeyBindingAction = 'fold' | 'call' | 'raise' | 'allin' | 'next'

const settingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']),
  keyBindings: z.object({
    fold: z.string(),
    call: z.string(),
    raise: z.string(),
    allin: z.string(),
    next: z.string(),
  }),
  trainingStrictness: z.number().min(1).max(10),
  soundEnabled: z.boolean(),
  defaultProvider: z.enum(PROVIDERS),
  hasCompletedOnboarding: z.boolean(),
})

interface SettingsState {
  theme: 'dark' | 'light' | 'system'
  keyBindings: Record<KeyBindingAction, string>
  trainingStrictness: number
  soundEnabled: boolean
  defaultProvider: Provider
  hasCompletedOnboarding: boolean

  setTheme: (theme: SettingsState['theme']) => void
  setKeyBinding: (action: KeyBindingAction, key: string) => void
  setTrainingStrictness: (k: number) => void
  setSoundEnabled: (enabled: boolean) => void
  setDefaultProvider: (provider: Provider) => void
  setOnboardingComplete: () => void
  resetOnboarding: () => void
}

const DEFAULTS = {
  theme: 'dark' as const,
  keyBindings: {
    fold: '1',
    call: '2',
    raise: '3',
    allin: '4',
    next: ' ',
  },
  trainingStrictness: 5,
  soundEnabled: false,
  defaultProvider: 'pekarstas' as Provider,
  hasCompletedOnboarding: false,
}

export const useSettingsStore = create(
  persist<SettingsState>(
    (set) => ({
      ...DEFAULTS,

      setTheme: (theme) => set({ theme }),
      setKeyBinding: (action, key) =>
        set((s) => ({ keyBindings: { ...s.keyBindings, [action]: key } })),
      setTrainingStrictness: (trainingStrictness) => set({ trainingStrictness }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setDefaultProvider: (defaultProvider) => set({ defaultProvider }),
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: 'uncles-table-settings',
      partialize: (state) => ({
        theme: state.theme,
        keyBindings: state.keyBindings,
        trainingStrictness: state.trainingStrictness,
        soundEnabled: state.soundEnabled,
        defaultProvider: state.defaultProvider,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }) as SettingsState,
      merge: (persisted, current) => {
        const result = settingsSchema.safeParse(persisted)
        if (result.success) {
          return { ...current, ...result.data }
        }
        console.warn('Invalid settingsStore state, using defaults')
        return current
      },
    },
  ),
)
