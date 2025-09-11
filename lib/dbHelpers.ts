import { prisma } from './prisma'
import { Prisma, PrismaClient } from '@prisma/client'

type Tx = PrismaClient | Prisma.TransactionClient

export async function getNextMeetupWithList(tx: Tx) {
  const nowIso = new Date().toISOString()
  const rows = await tx.$queryRawUnsafe<{ id: number; date: string; movieListId: number }[]>(
    `SELECT id, date, movieListId
     FROM "Meetup"
     WHERE movieListId IS NOT NULL AND datetime(date) > datetime(?)
     ORDER BY datetime(date) ASC
     LIMIT 1`,
    nowIso
  )
  if (!rows.length) return null
  return tx.meetup.findUnique({
    where: { id: rows[0].id },
    select: {
      id: true,
      date: true,
      movieListId: true,
      movieList: { include: { movies: true, votes: true } },
    },
  })
}

export async function getNextMeetupWithoutList(tx: Tx) {
  const nowIso = new Date().toISOString()
  const rows = await tx.$queryRawUnsafe<{ id: number; date: string; movieListId: number | null }[]>(
    `SELECT id, date, movieListId
     FROM "Meetup"
     WHERE movieListId IS NULL AND datetime(date) > datetime(?)
     ORDER BY datetime(date) ASC
     LIMIT 1`,
    nowIso
  )
  if (!rows.length) return null
  return tx.meetup.findUnique({
    where: { id: rows[0].id },
    select: {
      id: true,
      date: true,
      movieListId: true,
      movieList: { include: { movies: true, votes: true } },
    },
  })
}
