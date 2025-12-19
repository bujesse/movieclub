import { Prisma, PrismaClient } from '@prisma/client'

type Tx = PrismaClient | Prisma.TransactionClient

export async function getNextMeetupWithList(tx: Tx) {
  const nowIso = new Date().toISOString()
  const rows = await tx.$queryRawUnsafe<{ id: number; date: string; movieListId: number }[]>(
    `SELECT id, date, movieListId
     FROM "Meetup"
     WHERE movieListId IS NOT NULL AND datetime(date) > datetime(?)
     ORDER BY datetime(date) ASC
     LIMIT 1`,
    nowIso
  )
  if (!rows.length) return null
  const meetupId = rows[0].id
  return tx.meetup.findUnique({
    where: { id: meetupId },
    select: {
      id: true,
      date: true,
      movieListId: true,
      movieList: {
        include: {
          movies: {
            include: {
              movie: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          votes: {
            where: { meetupId },
          },
        },
      },
    },
  })
}

export async function getNextMeetupWithoutList(tx: Tx) {
  const nowIso = new Date().toISOString()
  const rows = await tx.$queryRawUnsafe<{ id: number; date: string; movieListId: number | null }[]>(
    `SELECT id, date, movieListId
     FROM "Meetup"
     WHERE movieListId IS NULL AND datetime(date) > datetime(?)
     ORDER BY datetime(date) ASC
     LIMIT 1`,
    nowIso
  )
  if (!rows.length) return null
  return tx.meetup.findUnique({
    where: { id: rows[0].id },
    select: {
      id: true,
      date: true,
      movieListId: true,
      movieList: {
        include: {
          movies: {
            include: {
              movie: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          votes: true,
        },
      },
    },
  })
}

export async function getPastMeetupLists(tx: Tx) {
  const nowIso = new Date().toISOString()
  const rows = await tx.$queryRawUnsafe<{ id: number; movieListId: number }[]>(
    `SELECT id, movieListId
     FROM "Meetup"
     WHERE movieListId IS NOT NULL AND datetime(date) < datetime(?)
     ORDER BY datetime(date) DESC`,
    nowIso
  )

  if (rows.length === 0) return []

  const lists = await Promise.all(
    rows.map((row) =>
      tx.movieList.findUnique({
        where: { id: row.movieListId },
        include: {
          movies: {
            include: {
              movie: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          votes: {
            where: { meetupId: row.id },
          },
          Meetup: true,
        },
      })
    )
  )

  return lists.filter((l): l is NonNullable<typeof l> => l !== null)
}

export async function getMeetupMovieTmdbIds(tx: Tx): Promise<Set<number>> {
  const rows = await tx.$queryRawUnsafe<{ id: number; movieListId: number }[]>(
    `SELECT id, movieListId
     FROM "Meetup"
     WHERE movieListId IS NOT NULL`
  )

  if (rows.length === 0) return new Set()

  const movieListIds = rows.map((row) => row.movieListId)

  // Query junction table and join with GlobalMovie to get tmdbIds
  const junctionEntries = await tx.movieListMovie.findMany({
    where: {
      movieListId: { in: movieListIds },
    },
    include: {
      movie: {
        select: {
          tmdbId: true,
        },
      },
    },
  })

  return new Set(junctionEntries.map((entry) => entry.movie.tmdbId))
}

export async function getUnscheduledMovieListTmdbIds(tx: Tx): Promise<Set<number>> {
  // Get lists that are not tied to any meetup yet
  const listRows = await tx.movieList.findMany({
    where: { Meetup: { is: null } },
    select: { id: true },
  })

  if (listRows.length === 0) return new Set()

  const movieListIds = listRows.map((row) => row.id)

  // Query junction table and join with GlobalMovie to get tmdbIds
  const junctionEntries = await tx.movieListMovie.findMany({
    where: {
      movieListId: { in: movieListIds },
    },
    include: {
      movie: {
        select: {
          tmdbId: true,
        },
      },
    },
  })

  return new Set(junctionEntries.map((entry) => entry.movie.tmdbId))
}
