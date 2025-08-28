import type { TmdbMovie, TmdbResponse } from '../types/tmdb'

export const fetchTmdb = async (q: string): Promise<TmdbMovie[] | null> => {
  if (!q.trim()) return null

  const res = await fetch(`/api/tmdb/search/movie?query=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('TMDB proxy failed')

  const data: TmdbResponse = await res.json()
  return data.results
}
