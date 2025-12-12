import { Prisma } from '@prisma/client'

export type CollectionWithMovies = Prisma.CollectionGetPayload<{
  include: {
    movies: {
      include: {
        movie: true
      }
    }
  }
}>

export type EnrichedCollection = CollectionWithMovies & {
  movies: (CollectionWithMovies['movies'][number] & {
    movie: CollectionWithMovies['movies'][number]['movie'] & {
      seenBy: string[]
      seenCount: number
      hasSeen: boolean
      inMeetup: boolean
      oscarNominations: number
      oscarWins: number
      oscarCategories: Record<string, { nominations: number; wins: number }> | null
    }
  })[]
  stats: {
    userSeenCount: number
    clubSeenCount: number
    anyoneSeenCount: number
  }
}

export interface LetterboxdMovie {
  id: number // tmdbId
  imdb_id: string
  title: string
  release_year: string
  poster_url?: string
  overview?: string
  clean_title?: string
  adult?: boolean
}
