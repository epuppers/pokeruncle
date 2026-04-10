import { useCallback, useEffect, useRef, useState } from 'react'

import { usePostflopTrainerStore } from '@/stores/postflopTrainerStore'

import type { PostflopAction } from '../types'
import { loadManifest, getSolution } from '../lib/solution-cache'
import { generatePostflopSpot, pickRandomEntry } from '../lib/spot-generator'
import type { SolutionManifestEntry } from '../lib/solution-schema'
import { usePostflopKeyboard } from '../hooks/use-postflop-keyboard'
import { PostflopActionBar } from './PostflopActionBar'
import { PostflopFeedbackView } from './PostflopFeedbackView'
import { PostflopTableView } from './PostflopTableView'

/** Session HUD for postflop training stats */
function PostflopSessionHud() {
  const stats = usePostflopTrainerStore((s) => s.sessionStats)
  const accuracy = stats.handsPlayed > 0
    ? Math.round((stats.correctCount / stats.handsPlayed) * 100)
    : 0
  const avgTime = stats.handsPlayed > 0
    ? Math.round(stats.totalDecisionTimeMs / stats.handsPlayed / 1000 * 10) / 10
    : 0

  if (stats.handsPlayed === 0) return null

  return (
    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
      <span>{stats.handsPlayed} hands</span>
      <span className="text-border">|</span>
      <span>{accuracy}% correct</span>
      <span className="text-border">|</span>
      <span>{avgTime}s avg</span>
    </div>
  )
}

export function PostflopTrainerPage() {
  const trainerPhase = usePostflopTrainerStore((s) => s.trainerPhase)
  const dealSpot = usePostflopTrainerStore((s) => s.dealSpot)
  const submitAction = usePostflopTrainerStore((s) => s.submitAction)
  const nextSpot = usePostflopTrainerStore((s) => s.nextSpot)
  const nodeKeyFilter = usePostflopTrainerStore((s) => s.nodeKeyFilter)

  const [manifest, setManifest] = useState<SolutionManifestEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const dealingRef = useRef(false)

  usePostflopKeyboard(nextSpot)

  // Load manifest on mount
  useEffect(() => {
    loadManifest()
      .then((m) => {
        setManifest(m.solutions)
        setLoading(false)
      })
      .catch((err: unknown) => {
        console.error('Failed to load postflop solutions manifest', err)
        setError('Failed to load postflop solutions. Check your connection and try again.')
        setLoading(false)
      })
  }, [])

  const dealNext = useCallback(async () => {
    if (!manifest || manifest.length === 0) return
    if (dealingRef.current) return
    dealingRef.current = true

    try {
      const entry = pickRandomEntry(manifest, nodeKeyFilter ?? undefined)
      const solution = await getSolution(entry.solutionKey)
      if (!solution) {
        console.error('Solution not found:', entry.solutionKey)
        return
      }
      const spot = generatePostflopSpot(solution)
      dealSpot(spot)
    } catch (err: unknown) {
      console.error('Failed to deal postflop spot', err)
      setError('Failed to load a postflop spot. Please try again.')
    } finally {
      dealingRef.current = false
    }
  }, [manifest, nodeKeyFilter, dealSpot])

  // Auto-deal when idle
  useEffect(() => {
    if (trainerPhase.phase === 'idle' && manifest && !loading) {
      void dealNext()
    }
  }, [trainerPhase.phase, manifest, loading, dealNext])

  // Get available actions from the current spot's strategy
  const availableActions: PostflopAction[] | undefined =
    trainerPhase.phase === 'street-decision'
      ? (Object.keys(trainerPhase.spot.correctStrategy) as PostflopAction[])
      : undefined

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-brass rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-2xl mx-auto w-full">
      <PostflopSessionHud />

      {trainerPhase.phase === 'street-decision' && (
        <>
          <PostflopTableView spot={trainerPhase.spot} />
          <PostflopActionBar
            onAction={submitAction}
            disabled={false}
            availableActions={availableActions}
          />
        </>
      )}

      {trainerPhase.phase === 'feedback' && (
        <PostflopFeedbackView
          spot={trainerPhase.spot}
          result={trainerPhase.result}
          onNext={nextSpot}
        />
      )}
    </div>
  )
}
