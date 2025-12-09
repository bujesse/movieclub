import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../../lib/cfAccess'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tmdbId: tmdbIdParam } = await params
  const tmdbId = Number(tmdbIdParam)

  if (isNaN(tmdbId)) {
    return NextResponse.json({ error: 'Invalid TMDB ID' }, { status: 400 })
  }

  const nominations = await prisma.oscarNomination.findMany({
    where: { tmdbId },
    select: {
      ceremony: true,
      year: true,
      class: true,
      category: true,
      canonicalCategory: true,
      name: true,
      winner: true,
      detail: true,
    },
    orderBy: [
      { ceremony: 'asc' },
      { winner: 'desc' }, // Winners first within each ceremony
    ],
  })

  return NextResponse.json(nominations)
}
