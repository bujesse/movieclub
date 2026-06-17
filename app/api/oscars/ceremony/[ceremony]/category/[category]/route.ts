import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../../../../lib/cfAccess'
import '../../../../../../../lib/bigintSerializer'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ceremony: string; category: string }> }
) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ceremony: ceremonyParam, category: categoryParam } = await params
  const ceremony = Number(ceremonyParam)

  if (isNaN(ceremony)) {
    return NextResponse.json({ error: 'Invalid ceremony number' }, { status: 400 })
  }

  const nominations = await prisma.oscarNomination.findMany({
    where: {
      ceremony,
      canonicalCategory: decodeURIComponent(categoryParam),
    },
    select: {
      name: true,
      detail: true,
      year: true,
      tmdbId: true,
      film: true,
      winner: true,
      nomId: true,
    },
    orderBy: [
      { winner: 'desc' },
      { film: 'asc' },
    ],
  })

  const winners = nominations.filter((nomination) => nomination.winner)

  return NextResponse.json({
    winner: winners[0] ?? null,
    winners,
    nominees: nominations.filter((nomination) => !nomination.winner),
  })
}
