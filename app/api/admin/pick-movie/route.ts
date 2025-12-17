import { NextResponse } from 'next/server'
import { getIdentity } from '../../../../lib/cfAccess'
import { pickMovieJob } from '../../../../lib/pickMovieJob'
import '../../../../lib/bigintSerializer'

export async function POST() {
  const me = await getIdentity()
  if (!me?.isAdmin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const result = await pickMovieJob(true)
  return NextResponse.json(result)
}
