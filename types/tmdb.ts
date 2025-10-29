// types/tmdb.ts
export interface TmdbMovie {
  adult: boolean
  backdrop_path: string | null
  genre_ids: number[]
  id: number
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string | null
  release_date: string
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export interface TmdbResponse {
  page: number
  results: TmdbMovie[]
  total_pages: number
  total_results: number
}

export type TmdbCast = {
  id: number
  adult: boolean
  gender: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string
  cast_id: number
  character: string
  credit_id: string
  order: number
}

export type TmdbCrew = {
  id: number
  adult: boolean
  gender: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string
  credit_id: string
  department: string
  job: string
}

export type TmdbCreditsResponse = {
  id: number
  cast: TmdbCast[]
  crew: TmdbCrew[]
}
export type TmdbGenre = { id: number; name: string }
export type TmdbProductionCompany = {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}
export type TmdbProductionCountry = { iso_3166_1: string; name: string }
export type TmdbSpokenLanguage = { english_name: string; iso_639_1: string; name: string }

export type TmdbMovieDetails = {
  adult: boolean
  backdrop_path: string | null
  belongs_to_collection?: unknown | null
  budget: number
  genres: TmdbGenre[]
  homepage: string | null
  id: number
  imdb_id: string | null
  original_language: string
  original_title: string
  overview: string | null
  popularity: number
  poster_path: string | null
  production_companies: TmdbProductionCompany[]
  production_countries: TmdbProductionCountry[]
  release_date: string | null
  revenue: number
  runtime: number | null
  spoken_languages: TmdbSpokenLanguage[]
  status: string
  tagline: string | null
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export const GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
}
