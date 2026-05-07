import { Prisma } from '@prisma/client'
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

function toReleaseDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeGenres(
  genres: Array<number> | Array<{ id: number }> | null | undefined
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (!genres) return Prisma.JsonNull

  if (genres.length === 0) {
    return []
  }

  if (typeof genres[0] === 'number') {
    return genres as Prisma.InputJsonValue
  }

  return (genres as Array<{ id: number }>).map((genre) => genre.id) as Prisma.InputJsonValue
}

function buildBaseMovieData(
  movie: {
    id: number
    title: string
    original_title?: string | null
    original_language?: string | null
    release_date?: string | null
    overview?: string | null
    vote_average?: number | null
    vote_count?: number | null
    poster_path?: string | null
    backdrop_path?: string | null
    popularity?: number | null
    runtime?: number | null
    budget?: number | null
    revenue?: number | null
    genres?: Array<number> | Array<{ id: number }> | null
  }
) {
  return {
    tmdbId: movie.id,
    title: movie.title,
    originalTitle: movie.original_title ?? null,
    originalLanguage: movie.original_language ?? null,
    releaseDate: toReleaseDate(movie.release_date),
    overview: movie.overview ?? null,
    voteAverage: movie.vote_average ?? null,
    voteCount: movie.vote_count ?? null,
    posterPath: movie.poster_path ?? null,
    backdropPath: movie.backdrop_path ?? null,
    genres: normalizeGenres(movie.genres),
    runtime: movie.runtime ?? null,
    popularity: Math.round(movie.popularity ?? 0),
    budget: movie.budget ?? null,
    revenue: movie.revenue ?? null,
  }
}

async function persistMovieDetails(
  tmdbId: number,
  details: TmdbMovieDetails,
  credits: TmdbCreditsResponse
) {
  const directorsList = credits.crew.filter((c) => c.job === 'Director')
  const actorsList = credits.cast.sort((a, b) => a.order - b.order).slice(0, ACTOR_LIMIT)

  await prisma.globalMovie.upsert({
    where: { tmdbId },
    update: {
      ...buildBaseMovieData(details),
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
    create: {
      ...buildBaseMovieData(details),
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
}

export async function saveMovieDetails(tmdbId: number) {
  const details = await getMovieDetails(tmdbId)
  const credits = await getMovieCredits(tmdbId)

  await persistMovieDetails(tmdbId, details, credits)

  return prisma.globalMovie.findUnique({ where: { tmdbId } })
}

export async function ensureGlobalMovieWithDetails(tmdbId: number) {
  const details = await getMovieDetails(tmdbId)
  const credits = await getMovieCredits(tmdbId)

  await persistMovieDetails(tmdbId, details, credits)

  return prisma.globalMovie.findUnique({ where: { tmdbId } })
}
