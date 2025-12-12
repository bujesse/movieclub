import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getIdentityFromRequest } from '../../../lib/cfAccess'
import { enrichCollections } from '../../../lib/enrichCollections'
import { saveMovieDetails } from '../../../lib/tmdb'
import type { LetterboxdMovie } from '../../../types/collection'

// GET all collections with enriched data
export async function GET(req: NextRequest) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collections = await prisma.collection.findMany({
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
    orderBy: {
      createdAt: 'desc',
    },
  })

  const enriched = await enrichCollections(collections, user.email)

  return NextResponse.json(enriched)
}

// POST - Create new collection (admin-only)
export async function POST(req: NextRequest) {
  try {
    const user = await getIdentityFromRequest(req)
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // TODO: Add admin check when admin system is implemented
    // if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, description, letterboxdUrl, isGlobal } = await req.json()

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!letterboxdUrl)
      return NextResponse.json({ error: 'Letterboxd URL is required' }, { status: 400 })

    // Fetch movies from Letterboxd
    const letterboxdApiUrl = `https://letterboxd-list-radarr.onrender.com/${letterboxdUrl}`
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

    // Use transaction to upsert GlobalMovies and create Collection with junction entries
    const collection = await prisma.$transaction(async (tx) => {
      // Upsert GlobalMovies first
      const movieIds: number[] = []
      for (const movie of normalizedMovies) {
        const globalMovie = await tx.globalMovie.upsert({
          where: { tmdbId: movie.tmdbId },
          update: {}, // Don't overwrite existing movies
          create: movie,
        })
        movieIds.push(globalMovie.id)
      }

      // Create Collection with junction entries
      return tx.collection.create({
        data: {
          name,
          description: description || null,
          letterboxdUrl,
          createdBy: user.email,
          isGlobal: isGlobal || false,
          movieCount: movieIds.length,
          lastSyncedAt: new Date(),
          movies: {
            create: movieIds.map((movieId, index) => ({
              movieId,
              order: index,
            })),
          },
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
    const tmdbIds = Array.from(new Set(collection.movies.map((m) => m.movie.tmdbId)))
    Promise.allSettled(tmdbIds.map((id) => saveMovieDetails(id)))
      .then(() => console.log(`Hydrated ${tmdbIds.length} movies for collection ${collection.id}`))
      .catch((err) => console.error('Error hydrating movie details:', err))

    // Re-fetch with updated details
    const updatedCollection = await prisma.collection.findUnique({
      where: { id: collection.id },
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

    if (!updatedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Enrich with seen data and stats
    const [enriched] = await enrichCollections([updatedCollection], user.email)

    return NextResponse.json(enriched, { status: 201 })
  } catch (err: any) {
    console.error('Create collection failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
