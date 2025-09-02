'use client'
import { Prisma } from '@prisma/client'
import React, { createContext, useContext } from 'react'

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
  return useContext(NextMeetupCtx)
}
