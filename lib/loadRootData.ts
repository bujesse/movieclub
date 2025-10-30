import { prisma } from './prisma'
import { enrichLists } from './enrichLists'
import { getNextMeetupWithList, getNextMeetupWithoutList } from './dbHelpers'

export async function loadRootData(meEmail?: string | null) {
  const nowIso = new Date().toISOString()
  console.log('[lr]', { now: nowIso, db: process.env.DATABASE_URL })

  const [withListRaw, withoutListRaw] = await Promise.all([
    getNextMeetupWithList(prisma),
    getNextMeetupWithoutList(prisma),
  ])

  // console.log(
  //   '[lr] withListRaw',
  //   withListRaw?.id,
  //   withListRaw?.date?.toISOString(),
  //   withListRaw?.movieListId
  // )
  // console.log(
  //   '[lr] withoutListRaw',
  //   withoutListRaw?.id,
  //   withoutListRaw?.date?.toISOString(),
  //   withoutListRaw?.movieListId
  // )

  // prefer future with-list; only if absent, use future without-list
  const picked = withListRaw ?? withoutListRaw ?? null
  if (!picked) return { nextMeetup: null, voteCount: 0 }

  const enrichedMovieList =
    meEmail && picked.movieList
      ? (await enrichLists([picked.movieList], meEmail))[0]
      : picked.movieList

  const voteCount =
    withoutListRaw && meEmail && !withoutListRaw.movieList
      ? await prisma.vote.count({ where: { userId: meEmail, meetupId: withoutListRaw.id } })
      : 0

  return { nextMeetup: { ...picked, movieList: enrichedMovieList }, voteCount }
}
