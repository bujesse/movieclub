import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getIdentityFromRequest } from '../../../../../lib/cfAccess'

const prisma = new PrismaClient()

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = await getIdentityFromRequest(req)
  if (!id) return new Response('Unauthorized', { status: 401 })

  const movieListId = Number(params.id)
  if (!Number.isFinite(movieListId)) return new Response('Bad list id', { status: 400 })

  await prisma.vote.upsert({
    where: { movieListId_userId: { movieListId, userId: id.email } },
    update: { value: 1 }, // ensure it's an upvote
    create: { movieListId, userId: id.email, value: 1 },
  })

  const agg = await prisma.vote.aggregate({
    where: { movieListId },
    _sum: { value: true },
  })
  const score = agg._sum.value ?? 0

  return Response.json({ ok: true, hasVoted: true, score })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = await getIdentityFromRequest(req)
  if (!id) return new Response('Unauthorized', { status: 401 })

  const movieListId = Number(params.id)
  if (!Number.isFinite(movieListId)) return new Response('Bad list id', { status: 400 })

  await prisma.vote
    .delete({
      where: { movieListId_userId: { movieListId, userId: id.email } },
    })
    .catch(() => null) // idempotent

  const agg = await prisma.vote.aggregate({
    where: { movieListId },
    _sum: { value: true },
  })
  const score = agg._sum.value ?? 0

  return Response.json({ ok: true, hasVoted: false, score })
}
