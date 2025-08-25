import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const { movieListId, userId, value } = await req.json()

  if (!movieListId || !userId || ![1, -1].includes(value)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  // Optional: prevent double voting by the same user
  const existingVote = await prisma.vote.findFirst({
    where: { movieListId, userId },
  })

  if (existingVote) {
    return NextResponse.json({ error: 'User has already voted' }, { status: 400 })
  }

  const vote = await prisma.vote.create({
    data: {
      movieListId,
      userId,
      value,
    },
  })

  return NextResponse.json(vote)
}
