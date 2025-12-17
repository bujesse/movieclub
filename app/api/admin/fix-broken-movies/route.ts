import { NextRequest, NextResponse } from 'next/server'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import { prisma } from '../../../../lib/prisma'
import { saveMovieDetails } from '../../../../lib/tmdb'

// POST - Fix all movies with missing TMDB details (admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getIdentityFromRequest(req)
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only admins can fix broken movies
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Find all movies with missing details
    const allMovies = await prisma.globalMovie.findMany({
      select: {
        id: true,
        tmdbId: true,
        title: true,
        actors: true,
        directors: true,
        genres: true,
        runtime: true,
      },
    })

    // Filter for movies with missing critical fields
    const brokenMovies = allMovies.filter(
      (m) =>
        m.actors === null ||
        m.directors === null ||
        m.genres === null ||
        m.runtime === null
    )

    console.log(`Found ${brokenMovies.length} movies with missing details`)

    // Start hydrating in background (don't await)
    ;(async () => {
      console.log(`Starting to hydrate ${brokenMovies.length} broken movies`)
      let successCount = 0
      let errorCount = 0

      for (const movie of brokenMovies) {
        try {
          console.log(`Hydrating ${movie.title} (tmdbId: ${movie.tmdbId})`)
          await saveMovieDetails(movie.tmdbId)
          successCount++
        } catch (err) {
          errorCount++
          console.error(`Failed to hydrate ${movie.title} (${movie.tmdbId}):`, err)
        }
        // Rate limit: 5 requests per second = 200ms delay between requests
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      console.log(`Hydration complete: ${successCount} success, ${errorCount} errors`)
    })().catch((err) => console.error('Error in background hydration:', err))

    return NextResponse.json({
      message: `Started hydrating ${brokenMovies.length} broken movies`,
      movieCount: brokenMovies.length,
    })
  } catch (err: any) {
    console.error('Fix broken movies failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
