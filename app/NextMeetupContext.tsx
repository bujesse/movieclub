'use client'
import { Prisma } from '@prisma/client'
import React, { createContext, useContext } from 'react'
import { POLLS_CLOSE_DAYS_BEFORE } from '../lib/config'
import { isBefore, subDays } from 'date-fns'

type NextMeetup = Prisma.MeetupGetPayload<{
  include: {
    movieList: {
      include: {
        movies: true
        votes: true
      }
    }
  }
}> | null

const NextMeetupCtx = createContext<NextMeetup>(null)

export function NextMeetupProvider({
  nextMeetup,
  children,
}: {
  nextMeetup: NextMeetup
  children: React.ReactNode
}) {
  return <NextMeetupCtx.Provider value={nextMeetup}>{children}</NextMeetupCtx.Provider>
}

export function useNextMeetup() {
  const nextMeetup = useContext(NextMeetupCtx)
  if (!nextMeetup?.date) return { nextMeetup, pollsCloseAt: null, pollsStillOpen: false }

  const date = new Date(nextMeetup.date)
  const pollsCloseAt = subDays(date, POLLS_CLOSE_DAYS_BEFORE)
  const pollsStillOpen = isBefore(Date.now(), pollsCloseAt)

  return { nextMeetup, pollsCloseAt, pollsStillOpen }
}
