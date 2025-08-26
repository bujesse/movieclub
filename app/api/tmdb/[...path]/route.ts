import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const { searchParams } = new URL(req.url)

  // Build the TMDB URL dynamically
  const tmdbUrl = new URL(`https://api.themoviedb.org/3/${path.join('/')}`)
  tmdbUrl.search = searchParams.toString()

  console.log('Fetching TMDB URL:', tmdbUrl.toString())

  const res = await fetch(tmdbUrl.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'TMDB request failed' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
