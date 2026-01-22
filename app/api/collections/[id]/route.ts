import { NextRequest, NextResponse } from 'next/server'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import { prisma } from '../../../../lib/prisma'
import { enrichCollections } from '../../../../lib/enrichCollections'
import { normalizeMovies } from '../../../../lib/helpers'
import { saveMovieDetails } from '../../../../lib/tmdb'
import '../../../../lib/bigintSerializer'

// GET single collection
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idParam } = await params
  const collectionId = Number(idParam)

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      movies: {
        include: {
          movie: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const [enriched] = await enrichCollections([collection], user.email)

  return NextResponse.json(enriched)
}

// PUT - Update collection name/description/movies
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idParam } = await params
  const collectionId = Number(idParam)

  // Ensure the collection exists
  const collection = await prisma.collection.findUnique({ where: { id: collectionId } })
  if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  // Check permissions (admin or creator only)
  const isAdmin = user.isAdmin
  if (collection.createdBy !== user.email && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { name, description, movies, isGlobal } = await req.json()

    const data: any = {}
    if (name) data.name = name
    if (description !== undefined) data.description = description
    if (typeof isGlobal === 'boolean' && isAdmin) {
      data.isGlobal = isGlobal
    }

    if (Array.isArray(movies) && movies.length === 0) {
      return NextResponse.json({ error: 'At least one movie is required' }, { status: 400 })
    }

    const normalizedMovies = Array.isArray(movies) ? normalizeMovies(movies) : null
    if (Array.isArray(movies) && normalizedMovies && normalizedMovies.length === 0) {
      return NextResponse.json({ error: 'At least one valid movie is required' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.collection.update({
        where: { id: collectionId },
        data,
      })

      if (normalizedMovies) {
        await tx.collectionMovie.deleteMany({
          where: { collectionId },
        })

        const movieIds: number[] = []
        for (const movie of normalizedMovies) {
          const globalMovie = await tx.globalMovie.upsert({
            where: { tmdbId: movie.tmdbId },
            update: {},
            create: movie,
          })
          movieIds.push(globalMovie.id)
        }

        await tx.collectionMovie.createMany({
          data: movieIds.map((movieId, index) => ({
            collectionId,
            movieId,
            order: index,
          })),
        })

        await tx.collection.update({
          where: { id: collectionId },
          data: { movieCount: movieIds.length },
        })
      }

      return tx.collection.findUnique({
        where: { id: collectionId },
        include: {
          movies: {
            include: {
              movie: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      })
    })

    if (!updated) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    if (normalizedMovies) {
      const tmdbIds = Array.from(new Set(normalizedMovies.map((m) => m.tmdbId)))
      Promise.allSettled(tmdbIds.map((id) => saveMovieDetails(id)))
        .then(() => console.log(`Hydrated ${tmdbIds.length} movies for collection ${collectionId}`))
        .catch((err) => console.error('Error hydrating movie details:', err))
    }

    const [enriched] = await enrichCollections([updated], user.email)

    return NextResponse.json(enriched, { status: 200 })
  } catch (err: any) {
    console.error('Update collection failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Delete collection
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return new Response('Unauthorized', { status: 401 })

  const { id: idParam } = await params
  const collectionId = Number(idParam)

  console.log('Deleting collection id:', idParam, 'by user:', user.email)

  // Ensure the collection exists
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  })
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  // Check permissions (admin or creator only)
  const isAdmin = user.isAdmin
  if (collection.createdBy !== user.email && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Delete the collection and its associated junction entries in a transaction
    await prisma.$transaction([
      prisma.collectionMovie.deleteMany({ where: { collectionId: collectionId } }),
      prisma.collection.delete({ where: { id: collectionId } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete collection failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
