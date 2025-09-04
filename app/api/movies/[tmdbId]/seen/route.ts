import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../../lib/cfAccess'

export async function POST(req: NextRequest, { params }: { params: Promise<{ tmdbId: string }> }) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.email

  const { tmdbId: tmdbIdParam } = await params
  const tmdbId = Number(tmdbIdParam)

  await prisma.seen.upsert({
    where: { userId_tmdbId: { userId, tmdbId } },
    update: {},
    create: { userId, tmdbId },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.email

  const { tmdbId: tmdbIdParam } = await params
  const tmdbId = Number(tmdbIdParam)

  await prisma.seen.delete({ where: { userId_tmdbId: { userId, tmdbId } } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
