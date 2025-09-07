import { NextRequest, NextResponse } from 'next/server'
import { getIdentityFromRequest } from '../../../../../lib/cfAccess'
import { prisma } from '../../../../../lib/prisma'
import { MAX_VOTES } from '../../../../../lib/config'
import { getNextMeetupWithoutList } from '../../../../../lib/dbHelpers'

export async function POST(req: NextRequest, { params }: { params: any }) {
  const id = await getIdentityFromRequest(req)
  if (!id) return new Response('Unauthorized', { status: 401 })

  const movieListId = Number(params.id)

  try {
    let score = 0
    let allTimeScore = 0

    await prisma.$transaction(async (tx) => {
      const meetup = await getNextMeetupWithoutList(tx)
      if (!meetup) throw new Error('NO_MEETUP')
      const meetupId = meetup.id

      // Enforce 3-vote limit for THIS upcoming meetup
      const used = await tx.vote.count({
        where: { userId: id.email, meetupId },
      })
      if (used >= MAX_VOTES) throw new Error('LIMIT_REACHED')

      // One vote per list per user per meetup
      await tx.vote.upsert({
        where: {
          movieListId_userId_meetupId: {
            movieListId,
            userId: id.email,
            meetupId,
          },
        },
        update: { value: 1 }, // force upvote
        create: { movieListId, userId: id.email, meetupId, value: 1 },
      })

      // Score for this meetup only
      const agg = await tx.vote.aggregate({
        where: { movieListId, meetupId },
        _sum: { value: true },
      })
      score = agg._sum.value ?? 0

      // All-time score across all meetups
      const allTimeAgg = await tx.vote.aggregate({
        where: { movieListId },
        _sum: { value: true },
      })
      allTimeScore = allTimeAgg._sum.value ?? 0
    })

    return NextResponse.json({ ok: true, hasVoted: true, score, allTimeScore })
  } catch (e: any) {
    if (e.message === 'NO_MEETUP') {
      return NextResponse.json({ error: 'No upcoming meetup to vote for' }, { status: 400 })
    }
    if (e.message === 'LIMIT_REACHED') {
      return NextResponse.json({ error: 'Vote limit reached for this meetup' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  const id = await getIdentityFromRequest(req)
  if (!id) return new Response('Unauthorized', { status: 401 })

  const movieListId = Number(params.id)

  try {
    const meetup = await getNextMeetupWithoutList(prisma)
    if (!meetup) return NextResponse.json({ error: 'No upcoming meetup' }, { status: 400 })
    const meetupId = meetup.id

    await prisma.vote
      .delete({
        where: {
          movieListId_userId_meetupId: {
            movieListId,
            userId: id.email,
            meetupId,
          },
        },
      })
      .catch(() => null) // idempotent

    // Score for this meetup only
    const agg = await prisma.vote.aggregate({
      where: { movieListId, meetupId },
      _sum: { value: true },
    })
    const score = agg._sum.value ?? 0

    // All-time score across all meetups
    const allTimeAgg = await prisma.vote.aggregate({
      where: { movieListId },
      _sum: { value: true },
    })
    const allTimeScore = allTimeAgg._sum.value ?? 0

    return NextResponse.json({ ok: true, hasVoted: false, score, allTimeScore })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
