import { NextRequest, NextResponse } from 'next/server'
import { getIdentityFromRequest } from '../../../../../lib/cfAccess'
import { prisma } from '../../../../../lib/prisma'
import { enrichCollections } from '../../../../../lib/enrichCollections'
import { saveMovieDetails } from '../../../../../lib/tmdb'
import type { LetterboxdMovie } from '../../../../../types/collection'

// POST - Sync collection from Letterboxd
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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

    if (!collection.letterboxdUrl) {
      return NextResponse.json({ error: 'Collection has no Letterboxd URL' }, { status: 400 })
    }

    // Fetch movies from Letterboxd
    const letterboxdApiUrl = `https://letterboxd-list-radarr.onrender.com/${collection.letterboxdUrl}`
    const letterboxdRes = await fetch(letterboxdApiUrl)

    if (!letterboxdRes.ok) {
      console.error('Letterboxd fetch failed:', letterboxdRes.status, letterboxdRes.statusText)
      return NextResponse.json({ error: 'Failed to fetch from Letterboxd' }, { status: 502 })
    }

    const letterboxdMovies: LetterboxdMovie[] = await letterboxdRes.json()

    if (!Array.isArray(letterboxdMovies) || letterboxdMovies.length === 0) {
      return NextResponse.json({ error: 'No movies found in Letterboxd list' }, { status: 400 })
    }

    // Normalize movies for database (similar to normalizeMovies helper)
    const normalizedMovies = letterboxdMovies.map((m) => ({
      tmdbId: m.id,
      title: m.title,
      originalTitle: m.title,
      releaseDate: m.release_year ? new Date(`${m.release_year}-01-01`) : null,
      overview: m.overview || null,
      posterPath: m.poster_url || null,
      // imdbId: m.imdb_id || null,
      // adult: m.adult || false,
    }))

    // Use transaction to delete old junction entries and create new ones
    const updated = await prisma.$transaction(async (tx) => {
      // Delete existing CollectionMovie entries
      await tx.collectionMovie.deleteMany({
        where: { collectionId },
      })

      // Upsert GlobalMovies
      const movieIds: number[] = []
      for (const movie of normalizedMovies) {
        const globalMovie = await tx.globalMovie.upsert({
          where: { tmdbId: movie.tmdbId },
          update: {}, // Don't overwrite existing movies
          create: movie,
        })
        movieIds.push(globalMovie.id)
      }

      // Create new CollectionMovie entries
      await tx.collectionMovie.createMany({
        data: movieIds.map((movieId, index) => ({
          collectionId,
          movieId,
          order: index,
        })),
      })

      // Update collection metadata
      return tx.collection.update({
        where: { id: collectionId },
        data: {
          movieCount: movieIds.length,
          lastSyncedAt: new Date(),
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
        },
      })
    })

    // Hydrate TMDB details in background (don't await)
    const tmdbIds = Array.from(new Set(updated.movies.map((m) => m.movie.tmdbId)))
    Promise.allSettled(tmdbIds.map((id) => saveMovieDetails(id)))
      .then(() => console.log(`Hydrated ${tmdbIds.length} movies for collection ${collectionId}`))
      .catch((err) => console.error('Error hydrating movie details:', err))

    // Re-fetch with updated details
    const refreshedCollection = await prisma.collection.findUnique({
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

    if (!refreshedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Enrich with seen data and stats
    const [enriched] = await enrichCollections([refreshedCollection], user.email)

    return NextResponse.json(enriched, { status: 200 })
  } catch (err: any) {
    console.error('Sync collection failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
