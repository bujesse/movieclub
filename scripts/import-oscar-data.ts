import { parse } from 'csv-parse/sync'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// TMDB Find API with rate limiting
const RATE_LIMIT_MS = 110 // 110ms = ~9 requests/sec (safe buffer under 10/s)
const CACHE_FILE = './oscar-tmdb-cache.json'

interface CsvRow {
  Ceremony: string
  Year: string
  Class: string
  CanonicalCategory: string
  Category: string
  NomId: string
  Film: string
  FilmId: string // IMDB ID
  Name: string
  Nominees: string
  NomineeIds: string
  Winner: string
  Detail: string
  Note: string
  Citation: string
  MultifilmNomination: string
}

async function findTmdbId(imdbId: string): Promise<number | null> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    throw new Error('TMDB_API_KEY environment variable is not set')
  }

  const url = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'accept': 'application/json'
    }
  })

  if (!res.ok) {
    console.error(`Failed to fetch TMDB for ${imdbId}: ${res.status} ${res.statusText}`)
    return null
  }

  const data = await res.json()
  const movie = data.movie_results?.[0]
  return movie?.id ?? null
}

async function importOscarData() {
  console.log('🎬 Starting Oscar data import...\n')
  console.log('Reading CSV...')

  const csv = readFileSync('./oscar_data.csv', 'utf-8')
  const rows: CsvRow[] = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    delimiter: '\t',
    relax_column_count: true,
    relax_quotes: true,
    escape: '\\',
    quote: '"'
  })

  console.log(`✓ Total rows: ${rows.length}`)

  // Filter rows with FilmIds
  const rowsWithFilmId = rows.filter(r => r.FilmId && r.FilmId.trim())
  console.log(`✓ Rows with FilmId: ${rowsWithFilmId.length}`)
  console.log(`✓ Rows without FilmId (skipped): ${rows.length - rowsWithFilmId.length}\n`)

  // Get unique IMDB IDs
  const uniqueImdbIds = [...new Set(rowsWithFilmId.map(r => r.FilmId))]
  console.log(`✓ Unique IMDB IDs: ${uniqueImdbIds.length}\n`)

  // Load/create cache
  let cache: Record<string, number | null> = {}
  if (existsSync(CACHE_FILE)) {
    cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
    console.log(`✓ Loaded ${Object.keys(cache).length} cached TMDB ID mappings\n`)
  } else {
    console.log('No cache found, starting fresh\n')
  }

  // Convert IMDB → TMDB with rate limiting
  const needsLookup = uniqueImdbIds.filter(id => cache[id] === undefined)

  if (needsLookup.length > 0) {
    console.log(`🔍 Converting ${needsLookup.length} IMDB IDs to TMDB IDs...`)
    console.log(`⏱️  Estimated time: ~${Math.ceil((needsLookup.length * RATE_LIMIT_MS) / 1000 / 60)} minutes\n`)

    let converted = 0
    let failed = 0

    for (const imdbId of needsLookup) {
      const tmdbId = await findTmdbId(imdbId)
      cache[imdbId] = tmdbId

      if (tmdbId) {
        converted++
        console.log(`  ✓ ${imdbId} → ${tmdbId}`)
      } else {
        failed++
        console.log(`  ✗ ${imdbId} → NOT FOUND`)
      }

      // Rate limit: wait between requests
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS))

      // Save cache periodically (every 100 requests)
      if ((converted + failed) % 100 === 0) {
        writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
        console.log(`\n💾 Saved cache (${converted + failed}/${needsLookup.length})\n`)
      }
    }

    // Final cache save
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
    console.log(`\n✓ Conversion complete: ${converted} found, ${failed} not found\n`)
  } else {
    console.log('✓ All IMDB IDs already in cache\n')
  }

  // Insert into database
  console.log('📊 Clearing existing Oscar data...')
  await prisma.oscarNomination.deleteMany()
  await prisma.oscarMovieSummary.deleteMany()
  console.log('✓ Cleared\n')

  console.log('📝 Inserting nominations into database...')

  let inserted = 0
  for (const row of rowsWithFilmId) {
    const tmdbId = cache[row.FilmId]

    try {
      await prisma.oscarNomination.create({
        data: {
          tmdbId: tmdbId ?? undefined,
          imdbId: row.FilmId,
          ceremony: parseInt(row.Ceremony),
          year: row.Year,
          class: row.Class,
          canonicalCategory: row.CanonicalCategory,
          category: row.Category,
          nomId: row.NomId,
          film: row.Film,
          name: row.Name || null,
          nominees: row.Nominees || null,
          nomineeIds: row.NomineeIds || null,
          winner: row.Winner === 'True',
          detail: row.Detail || null,
          note: row.Note || null,
          citation: row.Citation || null,
          multifilmNomination: row.MultifilmNomination === 'True'
        }
      })
      inserted++

      if (inserted % 1000 === 0) {
        console.log(`  ✓ Inserted ${inserted}/${rowsWithFilmId.length} nominations`)
      }
    } catch (error: any) {
      console.error(`Error inserting nomination ${row.NomId}:`, error.message)
    }
  }

  console.log(`\n✓ Inserted ${inserted} nominations\n`)

  // Generate summaries
  console.log('📈 Generating summary statistics...')

  // Get all tmdbIds with nominations
  const tmdbIds = [...new Set(
    rowsWithFilmId
      .map(r => cache[r.FilmId])
      .filter((id): id is number => id !== null)
  )]

  console.log(`  Processing ${tmdbIds.length} movies with TMDB IDs...\n`)

  let summariesCreated = 0
  for (const tmdbId of tmdbIds) {
    const nominations = await prisma.oscarNomination.findMany({
      where: { tmdbId }
    })

    // Skip if no nominations found (might happen due to duplicates or errors)
    if (nominations.length === 0) {
      continue
    }

    const totalNominations = nominations.length
    const totalWins = nominations.filter(n => n.winner).length

    // Group by category class (Acting, Directing, Production, etc.)
    const categoryBreakdown: Record<string, { nominations: number, wins: number }> = {}

    for (const nom of nominations) {
      if (!categoryBreakdown[nom.class]) {
        categoryBreakdown[nom.class] = { nominations: 0, wins: 0 }
      }
      categoryBreakdown[nom.class].nominations++
      if (nom.winner) categoryBreakdown[nom.class].wins++
    }

    await prisma.oscarMovieSummary.create({
      data: {
        tmdbId,
        imdbId: nominations[0].imdbId,
        totalNominations,
        totalWins,
        categoryBreakdown
      }
    })

    summariesCreated++
    if (summariesCreated % 500 === 0) {
      console.log(`  ✓ Generated ${summariesCreated}/${tmdbIds.length} summaries`)
    }
  }

  console.log(`\n✓ Generated summaries for ${summariesCreated} movies\n`)
  console.log('🎉 Import complete!\n')

  // Print some stats
  console.log('📊 Summary:')
  console.log(`  • Total nominations/wins: ${inserted}`)
  console.log(`  • Movies with TMDB IDs: ${tmdbIds.length}`)
  console.log(`  • Movies without TMDB IDs: ${rowsWithFilmId.length - inserted}`)
  console.log(`  • TMDB API calls made: ${needsLookup.length}`)
  console.log(`  • Cache file: ${CACHE_FILE}`)
}

importOscarData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
