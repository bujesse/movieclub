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

  const list = await prisma.movieList.findFirst({
    where: { id: movieListId, deletedAt: null },
    select: { id: true },
  })
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
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
        const nominationCount = await tx.nomination.count({
          where: {
            movieListId: existingNomination.movieListId,
            meetupId: nextMeetup.id,
          },
        })

        if (nominationCount <= 1) {
          await tx.vote.deleteMany({
            where: {
              movieListId: existingNomination.movieListId,
              meetupId: nextMeetup.id,
            },
          })
        } else {
          await tx.vote.deleteMany({
            where: {
              userId,
              movieListId: existingNomination.movieListId,
              meetupId: nextMeetup.id,
            },
          })
        }

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

  const list = await prisma.movieList.findFirst({
    where: { id: movieListId, deletedAt: null },
    select: { id: true },
  })
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const nominationCount = await tx.nomination.count({
        where: {
          movieListId,
          meetupId: nextMeetup.id,
        },
      })

      if (nominationCount <= 1) {
        await tx.vote.deleteMany({
          where: {
            movieListId,
            meetupId: nextMeetup.id,
          },
        })
      } else {
        await tx.vote.deleteMany({
          where: {
            userId,
            movieListId,
            meetupId: nextMeetup.id,
          },
        })
      }

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
