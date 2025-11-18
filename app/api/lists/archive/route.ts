import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import { enrichLists } from '../../../../lib/enrichLists'
import { getPastMeetupLists } from '../../../../lib/dbHelpers'

// GET movie lists associated with past meetups (archive)
export async function GET(req: NextRequest) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lists = await getPastMeetupLists(prisma)
  const enriched = await enrichLists(lists, user.email)

  // Sort by meetup date, most recent first
  enriched.sort((a, b) => {
    const dateA = (a as any).Meetup?.date ? new Date((a as any).Meetup.date).getTime() : 0
    const dateB = (b as any).Meetup?.date ? new Date((b as any).Meetup.date).getTime() : 0
    return dateB - dateA
  })

  return NextResponse.json(enriched)
}
