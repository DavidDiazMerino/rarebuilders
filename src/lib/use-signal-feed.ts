import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../state/AppState'
import { api } from './api'

export function useSignalFeed() {
  const { data, ingestSourceFeed } = useAppState()
  const [refreshing, setRefreshing] = useState(false)
  const attemptedCursor = useRef<string | null>(null)

  useEffect(() => {
    if (!data.profile.onboardingComplete || attemptedCursor.current === data.lastSignalCursor) return
    attemptedCursor.current = data.lastSignalCursor
    setRefreshing(true)
    void api.signalFeed(data.lastSignalCursor)
      .then((response) => {
        ingestSourceFeed(
          response.data.candidates,
          response.data.opportunities,
          response.data.cursor,
          response.data.digest,
        )
      })
      .catch(() => {
        // Existing local radar remains usable if the public feed is unavailable.
      })
      .finally(() => setRefreshing(false))
  }, [data.lastSignalCursor, data.profile.onboardingComplete, ingestSourceFeed])

  return refreshing
}
