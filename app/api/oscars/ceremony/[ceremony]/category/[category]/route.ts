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

  const winner = await prisma.oscarNomination.findFirst({
    where: {
      ceremony,
      canonicalCategory: decodeURIComponent(categoryParam),
      winner: true,
    },
    select: {
      name: true,
      detail: true,
      year: true,
      tmdbId: true,
      film: true,
    },
  })

  return NextResponse.json(winner)
}
