import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import '../../../../lib/bigintSerializer'

export async function GET(req: NextRequest) {
  const user = await getIdentityFromRequest(req)
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const meetups = await prisma.meetup.findMany({
    include: {
      movieList: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  const lists = await prisma.movieList.findMany({
    select: {
      id: true,
      title: true,
      Meetup: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      title: 'asc',
    },
  })

  return NextResponse.json({
    meetups,
    lists: lists.map((list) => ({
      id: list.id,
      title: list.title,
      meetupId: list.Meetup?.id ?? null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getIdentityFromRequest(req)
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.date) {
    return NextResponse.json({ error: 'Meetup date is required' }, { status: 400 })
  }

  const parsedDate = new Date(body.date)
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid meetup date' }, { status: 400 })
  }

  const movieListId =
    body.movieListId === null || body.movieListId === undefined || body.movieListId === ''
      ? null
      : Number(body.movieListId)

  if (movieListId !== null) {
    const list = await prisma.movieList.findUnique({ where: { id: movieListId } })
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    const existing = await prisma.meetup.findFirst({ where: { movieListId } })
    if (existing) {
      return NextResponse.json(
        { error: 'That list is already assigned to another meetup' },
        { status: 409 }
      )
    }
  }

  const meetup = await prisma.meetup.create({
    data: {
      date: parsedDate,
      movieListId,
    },
    include: {
      movieList: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  return NextResponse.json(meetup, { status: 201 })
}
