import { prisma } from './prisma'
import { Prisma, PrismaClient } from '@prisma/client'

export async function getNextMeetupWithoutList(
  tx: PrismaClient | Prisma.TransactionClient = prisma
) {
  const meetup = await tx.meetup.findFirst({
    where: { date: { gt: new Date() }, movieListId: null },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      movieListId: true,
      movieList: { include: { movies: true, votes: true } },
    },
  })
  return meetup ?? null
}

export async function getNextMeetupWithList(tx: PrismaClient | Prisma.TransactionClient = prisma) {
  const meetup = await tx.meetup.findFirst({
    where: { date: { gt: new Date() }, movieListId: { not: null } },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      movieListId: true,
      movieList: { include: { movies: true, votes: true } },
    },
  })
  return meetup ?? null
}
