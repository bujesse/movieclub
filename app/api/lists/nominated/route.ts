import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import { enrichLists } from '../../../../lib/enrichLists'
import { getNextMeetupWithoutList } from '../../../../lib/dbHelpers'
import '../../../../lib/bigintSerializer'

export async function GET(req: NextRequest) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nextMeetup = await getNextMeetupWithoutList(prisma)
  if (!nextMeetup) return NextResponse.json([])

  const nominations = await prisma.nomination.findMany({
    where: { meetupId: nextMeetup.id },
    select: { movieListId: true },
  })

  const listIds = nominations.map((n) => n.movieListId)
  if (listIds.length === 0) return NextResponse.json([])

  const lists = await prisma.movieList.findMany({
    where: {
      id: { in: listIds },
    },
    include: {
      movies: {
        include: {
          movie: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
      votes: { where: { meetupId: nextMeetup.id } },
      nominations: { where: { meetupId: nextMeetup.id } },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  const enriched = await enrichLists(lists, user.email)

  enriched.sort((a, b) => {
    const cur = (b.votes?.length ?? 0) - (a.votes?.length ?? 0)
    if (cur !== 0) return cur
    const allTime = (b.votesTotal ?? 0) - (a.votesTotal ?? 0)
    if (allTime !== 0) return allTime
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return NextResponse.json(enriched)
}
