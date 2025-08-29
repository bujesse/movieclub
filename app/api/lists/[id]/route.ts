import { NextRequest, NextResponse } from 'next/server'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import { revalidatePath } from 'next/cache'
import { normalizeMovies } from '../route'
import { prisma } from '../../../../lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Auth
  const user = await getIdentityFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.email

  const { id: idParam } = await params
  const movieListId = Number(idParam)

  // Esnure the list exists and was created by this user
  const list = await prisma.movieList.findUnique({ where: { id: movieListId } })
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })
  if (list.createdBy !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { title, movies } = await req.json()
    const data: any = {}
    if (title) data.title = title
    if (movies) {
      data.movies = { deleteMany: {}, create: normalizeMovies(movies) }
    }

    const updated = await prisma.movieList.update({
      where: { id: movieListId },
      data,
      include: { movies: true, votes: true },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate movie' }, { status: 409 })
    }
    console.error('Update failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getIdentityFromRequest(req)
  if (!user) return new Response('Unauthorized', { status: 401 })
  const userId = user.email

  const { id: idParam } = await params
  const movieListId = Number(idParam)

  console.log('Deleting list id:', idParam, 'by user:', userId)

  // Ensure the list exists and was created by this user
  const list = await prisma.movieList.findUnique({
    where: { id: movieListId },
  })
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  if (list.createdBy !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Delete the list and its associated movies and votes in a transaction
    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { movieListId: movieListId } }),
      prisma.movie.deleteMany({ where: { movieListId: movieListId } }),
      prisma.movieList.delete({ where: { id: movieListId } }),
    ])

    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete list failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
