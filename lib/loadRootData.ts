import { prisma } from './prisma'
import { enrichLists } from './enrichLists'
import { getNextMeetupWithList, getNextMeetupWithoutList } from './dbHelpers'

export async function loadRootData(meEmail?: string | null) {
  const now = new Date()
  console.log('[lr]', { now: now.toISOString(), db: process.env.DATABASE_URL })

  const [withListRaw, withoutListRaw] = await Promise.all([
    getNextMeetupWithList(prisma),
    getNextMeetupWithoutList(prisma),
  ])

  console.log(
    '[lr] withListRaw',
    withListRaw?.id,
    withListRaw?.date?.toISOString(),
    withListRaw?.movieListId
  )
  console.log(
    '[lr] withoutListRaw',
    withoutListRaw?.id,
    withoutListRaw?.date?.toISOString(),
    withoutListRaw?.movieListId
  )

  // Guard against any past rows slipping through
  const withList = withListRaw && withListRaw.date! > now ? withListRaw : null
  const withoutList = withoutListRaw && withoutListRaw.date! > now ? withoutListRaw : null

  const raw =
    [withList, withoutList].filter(Boolean).sort((a, b) => +a!.date! - +b!.date!)[0] ?? null

  if (!raw) return { nextMeetup: null, voteCount: 0 }

  const enrichedMovieList =
    meEmail && raw.movieList ? (await enrichLists([raw.movieList], meEmail))[0] : raw.movieList

  const voteCount =
    meEmail && withoutList
      ? await prisma.vote.count({ where: { userId: meEmail, meetupId: withoutList.id } })
      : 0

  return { nextMeetup: { ...raw, movieList: enrichedMovieList }, voteCount }
}
