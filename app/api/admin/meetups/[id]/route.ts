import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../../lib/cfAccess'
import '../../../../../lib/bigintSerializer'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getIdentityFromRequest(req)
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const meetupId = Number(id)
  if (!Number.isFinite(meetupId)) {
    return NextResponse.json({ error: 'Invalid meetup id' }, { status: 400 })
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
    const existing = await prisma.meetup.findFirst({
      where: { movieListId, id: { not: meetupId } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'That list is already assigned to another meetup' },
        { status: 409 }
      )
    }
  }

  try {
    const updated = await prisma.meetup.update({
      where: { id: meetupId },
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
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update meetup failed:', err)
    return NextResponse.json({ error: 'Meetup not found' }, { status: 404 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getIdentityFromRequest(req)
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const meetupId = Number(id)
  if (!Number.isFinite(meetupId)) {
    return NextResponse.json({ error: 'Invalid meetup id' }, { status: 400 })
  }

  try {
    await prisma.meetup.delete({ where: { id: meetupId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete meetup failed:', err)
    return NextResponse.json({ error: 'Meetup not found' }, { status: 404 })
  }
}
