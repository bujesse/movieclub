import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import { getMeetupMovieTmdbIds } from '../../../../lib/dbHelpers'

export async function GET(req: NextRequest) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meetupMovieTmdbIds = await getMeetupMovieTmdbIds(prisma)

  return NextResponse.json(Array.from(meetupMovieTmdbIds))
}
