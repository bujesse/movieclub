import { NextRequest, NextResponse } from 'next/server'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import { revalidatePath } from 'next/cache'
import { prisma } from '../../../../lib/prisma'
import { normalizeMovies } from '../../../../lib/helpers'
import { saveMovieDetails } from '../../../../lib/tmdb'
import { getNextMeetupWithoutList } from '../../../../lib/dbHelpers'
import { enrichLists } from '../../../../lib/enrichLists'
import '../../../../lib/bigintSerializer'

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
    const { title, description, movies } = await req.json()
    const nextMeetup = await getNextMeetupWithoutList(prisma)

    const normalizedMovies = movies ? normalizeMovies(movies) : null

    const updated = await prisma.$transaction(async (tx) => {
      // Update title and description
      const data: any = {}
      if (title) data.title = title
      data.description = description

      await tx.movieList.update({
        where: { id: movieListId },
        data,
      })

      // If movies provided, update junction entries
      if (normalizedMovies) {
        // Delete existing junction entries
        await tx.movieListMovie.deleteMany({
          where: { movieListId },
        })

        // Upsert GlobalMovies and create new junction entries
        const movieIds: number[] = []
        for (const movie of normalizedMovies) {
          const globalMovie = await tx.globalMovie.upsert({
            where: { tmdbId: movie.tmdbId },
            update: {}, // Don't overwrite existing
            create: movie,
          })
          movieIds.push(globalMovie.id)
        }

        // Create new junction entries
        await tx.movieListMovie.createMany({
          data: movieIds.map((movieId, index) => ({
            movieListId,
            movieId,
            order: index,
          })),
        })
      }

      // Re-fetch with updated details
      return tx.movieList.findUnique({
        where: { id: movieListId },
        include: {
          movies: {
            include: {
              movie: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          votes: nextMeetup ? { where: { meetupId: nextMeetup.id } } : true,
          nominations: nextMeetup ? { where: { meetupId: nextMeetup.id } } : true,
        },
      })
    })

    if (!updated) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Hydrate TMDB details in background (don't await)
    if (normalizedMovies) {
      const tmdbIds = Array.from(new Set(normalizedMovies.map((m) => m.tmdbId)))
      Promise.allSettled(tmdbIds.map((id) => saveMovieDetails(id)))
        .then(() => console.log(`Hydrated ${tmdbIds.length} movies for list ${movieListId}`))
        .catch((err) => console.error('Error hydrating movie details:', err))
    }

    // Enrich with Oscar data, seen counts, etc.
    const [enriched] = await enrichLists([updated], userId)

    return NextResponse.json(enriched, { status: 200 })
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

  // Check if the list has a nomination with votes from other users
  const nextMeetup = await getNextMeetupWithoutList(prisma)
  if (nextMeetup) {
    const nomination = await prisma.nomination.findFirst({
      where: {
        movieListId,
        userId,
        meetupId: nextMeetup.id,
      },
    })

    if (nomination) {
      const votesFromOthers = await prisma.vote.count({
        where: {
          movieListId,
          meetupId: nextMeetup.id,
          userId: { not: userId },
        },
      })

      if (votesFromOthers > 0) {
        return NextResponse.json(
          { error: 'Cannot delete list - other users have voted for this nomination' },
          { status: 400 }
        )
      }
    }
  }

  try {
    // Delete the list and its associated data in a transaction
    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { movieListId: movieListId } }),
      prisma.nomination.deleteMany({ where: { movieListId: movieListId } }),
      prisma.movieListMovie.deleteMany({ where: { movieListId: movieListId } }),
      prisma.movieList.delete({ where: { id: movieListId } }),
    ])

    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete list failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
