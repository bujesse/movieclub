import { NextRequest, NextResponse } from 'next/server'
import { getIdentityFromRequest } from '../../../../../lib/cfAccess'
import { prisma } from '../../../../../lib/prisma'
import { getNextMeetupWithoutList } from '../../../../../lib/dbHelpers'
import '../../../../../lib/bigintSerializer'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getIdentityFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.email

  const { id: idParam } = await params
  const movieListId = Number(idParam)

  const nextMeetup = await getNextMeetupWithoutList(prisma)
  if (!nextMeetup) {
    return NextResponse.json({ error: 'No upcoming meetup to nominate for' }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existingNomination = await tx.nomination.findFirst({
        where: {
          userId,
          meetupId: nextMeetup.id,
        },
      })

      if (existingNomination) {
        await tx.vote.deleteMany({
          where: {
            userId,
            movieListId: existingNomination.movieListId,
            meetupId: nextMeetup.id,
          },
        })

        await tx.nomination.deleteMany({
          where: {
            userId,
            meetupId: nextMeetup.id,
          },
        })
      }

      await tx.nomination.create({
        data: {
          movieListId,
          userId,
          meetupId: nextMeetup.id,
        },
      })
    })

    return NextResponse.json({ hasNominated: true })
  } catch (err) {
    console.error('Nomination failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getIdentityFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.email

  const { id: idParam } = await params
  const movieListId = Number(idParam)

  const nextMeetup = await getNextMeetupWithoutList(prisma)
  if (!nextMeetup) {
    return NextResponse.json({ error: 'No upcoming meetup' }, { status: 400 })
  }

  try {
    // Check if there are votes from other users
    const votesFromOthers = await prisma.vote.count({
      where: {
        movieListId,
        meetupId: nextMeetup.id,
        userId: { not: userId },
      },
    })

    if (votesFromOthers > 0) {
      return NextResponse.json(
        { error: 'Cannot remove nomination - other users have voted for this list' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.vote.deleteMany({
        where: {
          userId,
          movieListId,
          meetupId: nextMeetup.id,
        },
      })

      await tx.nomination.deleteMany({
        where: {
          movieListId,
          userId,
          meetupId: nextMeetup.id,
        },
      })
    })

    return NextResponse.json({ hasNominated: false })
  } catch (err) {
    console.error('Remove nomination failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
