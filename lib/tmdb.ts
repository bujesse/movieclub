import type { TmdbCreditsResponse, TmdbMovie, TmdbMovieDetails, TmdbResponse } from '../types/tmdb'
import { prisma } from './prisma'

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export const searchTmdb = async (q: string): Promise<TmdbMovie[]> => {
  if (!q.trim()) return []

  const res = await fetch(`/api/tmdb/search/movie?query=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('TMDB proxy failed')

  const data: TmdbResponse = await res.json()

  data.results.sort((a, b) => b.popularity - a.popularity)

  return data.results
}

export const tmdbImage = (path?: string | null, size: 'w200' | 'w300' | 'w500' = 'w300') => {
  if (!path) return ''
  const p = path.startsWith('/') ? path : `/${path}`
  return `https://image.tmdb.org/t/p/${size}${p}`
}

export async function getMovieCredits(tmdbId: number): Promise<TmdbCreditsResponse> {
  const url = new URL(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`)
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
  })
  if (!res.ok) throw new Error('TMDB credits proxy failed')
  const data: TmdbCreditsResponse = await res.json()
  return data
}

export async function getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
  const url = new URL(`${TMDB_BASE_URL}/movie/${tmdbId}`)
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
  })

  if (!res.ok) throw new Error('TMDB details proxy failed')
  const data: TmdbMovieDetails = await res.json()
  return data
}

const ACTOR_LIMIT = 10

export async function saveMovieDetails(tmdbId: number) {
  const details = await getMovieDetails(tmdbId)
  const credits = await getMovieCredits(tmdbId)
  const directorsList = credits.crew.filter((c) => c.job === 'Director')
  const actorsList = credits.cast.sort((a, b) => a.order - b.order).slice(0, ACTOR_LIMIT)

  await prisma.globalMovie.updateMany({
    where: { tmdbId },
    data: {
      runtime: details.runtime,
      originalLanguage: details.original_language,
      popularity: details.popularity,
      budget: details.budget,
      revenue: details.revenue,
      overview: details.overview,
      voteAverage: details.vote_average,
      voteCount: details.vote_count,
      posterPath: details.poster_path,
      backdropPath: details.backdrop_path,
      genres: details.genres,
      directors: directorsList.map((d) => ({
        id: d.id,
        name: d.name,
        credit_id: d.credit_id,
      })),
      actors: actorsList.map((a) => ({
        id: a.id,
        name: a.name,
        character: a.character,
        order: a.order,
        credit_id: a.credit_id,
      })),
    },
  })

  return prisma.globalMovie.findMany({ where: { tmdbId } })
}
