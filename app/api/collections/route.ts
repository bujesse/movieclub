import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getIdentityFromRequest } from '../../../lib/cfAccess'
import { enrichCollections } from '../../../lib/enrichCollections'
import { saveMovieDetails } from '../../../lib/tmdb'
import { normalizeMovies } from '../../../lib/helpers'
import '../../../lib/bigintSerializer'

// GET all collections with enriched data
export async function GET(req: NextRequest) {
  try {
    const user = await getIdentityFromRequest(req)
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    console.log('[GET /api/collections] User:', user.email)

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

    console.log('[GET /api/collections] Found', collections.length, 'collections')

    if (collections.length === 0) {
      console.log('[GET /api/collections] No collections found in database')
      return NextResponse.json([])
    }

    // Try to enrich, but return basic data if enrichment fails
    try {
      console.log('[GET /api/collections] Attempting to enrich collections...')
      const enriched = await enrichCollections(collections, user.email)
      console.log('[GET /api/collections] Successfully enriched', enriched.length, 'collections')
      return NextResponse.json(enriched)
    } catch (enrichError) {
      console.error(
        '[GET /api/collections] Enrichment failed, returning basic collection data:',
        enrichError
      )
      // Return collections with basic structure even if enrichment fails
      const basicCollections = collections.map((c) => ({
        ...c,
        movies: c.movies.map((m) => ({
          ...m,
          movie: {
            ...m.movie,
            seenBy: [],
            seenCount: 0,
            hasSeen: false,
            inMeetup: false,
            oscarNominations: 0,
            oscarWins: 0,
            oscarCategories: null,
          },
        })),
        stats: {
          userSeenCount: 0,
          clubSeenCount: 0,
          anyoneSeenCount: 0,
        },
      }))
      console.log('[GET /api/collections] Returning', basicCollections.length, 'basic collections')
      return NextResponse.json(basicCollections)
    }
  } catch (err: any) {
    console.error('[GET /api/collections] Fatal error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Create new collection (admin-only)
export async function POST(req: NextRequest) {
  try {
    const user = await getIdentityFromRequest(req)
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // TODO: Add admin check when admin system is implemented
    // if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const isAdmin = user.isAdmin

    const { name, description, isGlobal, movies } = await req.json()

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!Array.isArray(movies) || movies.length === 0) {
      return NextResponse.json({ error: 'At least one movie is required' }, { status: 400 })
    }

    const normalizedMovies = normalizeMovies(movies)
    if (normalizedMovies.length === 0) {
      return NextResponse.json({ error: 'At least one valid movie is required' }, { status: 400 })
    }

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
          createdBy: user.email,
          isGlobal: isAdmin ? Boolean(isGlobal) : false,
          movieCount: movieIds.length,
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

    // Hydrate TMDB details in background with rate limiting (max 5 requests/second)
    const tmdbIds = Array.from(new Set(collection.movies.map((m) => m.movie.tmdbId)))
    ;(async () => {
      console.log(
        `Starting to hydrate ${tmdbIds.length} movies for new collection ${collection.id}`
      )
      let successCount = 0
      let errorCount = 0

      for (const tmdbId of tmdbIds) {
        try {
          await saveMovieDetails(tmdbId)
          successCount++
        } catch (err) {
          errorCount++
          console.error(`Failed to hydrate movie ${tmdbId}:`, err)
        }
        // Rate limit: 5 requests per second = 200ms delay between requests
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      console.log(
        `Hydration complete for collection ${collection.id}: ${successCount} success, ${errorCount} errors`
      )
    })().catch((err) => console.error('Error hydrating movie details:', err))

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
