import { prisma } from './prisma'
import { enrichLists } from './enrichLists'
import { getNextMeetupWithList, getNextMeetupWithoutList } from './dbHelpers'

export async function loadRootData(meEmail?: string | null) {
  let raw = await getNextMeetupWithList(prisma)
  const nextMeetupWithoutList = await getNextMeetupWithoutList(prisma)

  if (!raw) {
    raw = nextMeetupWithoutList
  }

  if (!raw || !nextMeetupWithoutList) {
    return {
      nextMeetup: null,
      voteCount: 0,
    }
  }

  const enrichedMovieList = raw.movieList
    ? (await enrichLists([raw.movieList], meEmail ?? undefined))[0]
    : null

  const myVoteCount = meEmail
    ? await prisma.vote.count({ where: { userId: meEmail, meetupId: nextMeetupWithoutList.id } })
    : 0

  return {
    nextMeetup: { ...raw, movieList: enrichedMovieList },
    voteCount: myVoteCount,
  }
}
