import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod/v4'
import { PROVIDERS } from '@/types/poker'
import type { Provider } from '@/types/poker'

const trainerStateSchema = z.object({
  provider: z.enum(PROVIDERS),
})

type TrainerState = {
  provider: Provider
  setProvider: (p: Provider) => void
}

export const useTrainerStore = create(
  persist<TrainerState>(
    (set) => ({
      provider: 'pekarstas' as Provider,
      setProvider: (provider) => set({ provider }),
    }),
    {
      name: 'poker-trainer',
      merge: (persisted, current) => {
        const result = trainerStateSchema.safeParse(persisted)
        if (result.success) {
          return { ...current, ...result.data }
        }
        console.warn('Invalid trainerStore state, using defaults')
        return current
      },
    },
  ),
)
