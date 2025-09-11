'use client'

import { createContext, useContext, useMemo } from 'react'
import { MAX_VOTES } from '../lib/config'

type VotesContextValue = {
  usedVotes: number
  remainingVotes: number
  maxVotes: number
  canVote: boolean
}

const VotesContext = createContext<VotesContextValue | null>(null)

export function VotesProvider({
  initialUsed,
  children,
}: {
  initialUsed: number
  children: React.ReactNode
}) {
  const value = useMemo(() => {
    const remainingVotes = Math.max(0, MAX_VOTES - initialUsed)
    return {
      usedVotes: initialUsed,
      remainingVotes,
      maxVotes: MAX_VOTES,
      canVote: remainingVotes > 0,
    }
  }, [initialUsed])

  return <VotesContext.Provider value={value}>{children}</VotesContext.Provider>
}

export function useVotes() {
  const ctx = useContext(VotesContext)
  if (!ctx) throw new Error('useVotes must be used inside <VotesProvider>')
  return ctx
}
