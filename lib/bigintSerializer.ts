/**
 * Global BigInt serialization setup.
 * This makes JSON.stringify automatically convert BigInt to string.
 * Import this once in your app to enable BigInt serialization everywhere.
 */

// Override BigInt.prototype.toJSON to return a string
// @ts-ignore - BigInt doesn't have toJSON in TypeScript types
BigInt.prototype.toJSON = function () {
  return this.toString()
}

// Re-export for convenience if needed in specific routes
export function serializeMovies<T extends { budget?: bigint | null; revenue?: bigint | null }>(
  movies: T[]
): (Omit<T, 'budget' | 'revenue'> & { budget: string | null; revenue: string | null })[] {
  return movies.map((m) => ({
    ...m,
    budget: m.budget ? String(m.budget) : null,
    revenue: m.revenue ? String(m.revenue) : null,
  }))
}

export function serializeCollectionMovies<T extends { movie: { budget?: bigint | null; revenue?: bigint | null } }>(
  movies: T[]
) {
  return movies.map((m) => ({
    ...m,
    movie: {
      ...m.movie,
      budget: m.movie.budget ? String(m.movie.budget) : null,
      revenue: m.movie.revenue ? String(m.movie.revenue) : null,
    },
  }))
}
