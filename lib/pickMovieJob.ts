import { subDays } from 'date-fns'
import { prisma } from './prisma'
import { POLLS_CLOSE_DAYS_BEFORE } from './config'
import { getNextMeetupWithoutList } from './dbHelpers'

export async function pickMovieJob(bypassCutoff = false) {
  const tag = '[pickMovieJob]'
  const t0 = Date.now()
  const done = (res: any) => {
    console.log(tag, 'done', { ...res, elapsedMs: Date.now() - t0 })
    return res
  }

  try {
    const now = new Date()
    console.log(tag, 'start', { now: now.toISOString(), POLLS_CLOSE_DAYS_BEFORE })

    const meetup = await getNextMeetupWithoutList(prisma)
    console.log(
      tag,
      'meetup.query.result',
      meetup
        ? {
            id: meetup.id,
            date: meetup.date?.toISOString() ?? null,
            movieListId: meetup.movieListId ?? null,
          }
        : { none: true }
    )

    if (!meetup?.date) return done({ ran: false, reason: 'no upcoming meetup' })

    const cutoff = subDays(new Date(meetup.date), POLLS_CLOSE_DAYS_BEFORE)
    const effectiveCutoff = bypassCutoff ? now : cutoff
    if (!bypassCutoff && now < cutoff) {
      return done({ ran: false, reason: 'before cutoff', cutoff: cutoff.toISOString() })
    }

    // Candidate lists: not yet linked to any meetup
    const candidates = await prisma.movieList.findMany({
      where: { Meetup: null },
      select: { id: true, createdAt: true },
    })
    if (candidates.length === 0) return done({ ran: false, reason: 'no candidate lists' })

    // Votes for NEXT meetup up to effective cutoff
    const agg = await prisma.vote.groupBy({
      by: ['movieListId'],
      where: {
        meetupId: meetup.id,
        createdAt: { lte: effectiveCutoff },
        movieListId: { in: candidates.map((c) => c.id) },
      },
      _count: { _all: true },
    })
    const countMap = new Map<number, number>(agg.map((r) => [r.movieListId, r._count._all]))

    // Order exactly like GET: votes desc, then createdAt asc
    candidates.sort((a, b) => {
      const diff = (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0)
      if (diff !== 0) return diff
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    const ballotId = candidates[0].id
    console.log(tag, 'ordered.pick', {
      top: candidates.slice(0, 5).map((c) => ({
        id: c.id,
        votes: countMap.get(c.id) ?? 0,
        createdAt: c.createdAt.toISOString(),
      })),
      chosen: ballotId,
    })

    await prisma.$transaction(async (tx) => {
      const fresh = await tx.meetup.findUnique({
        where: { id: meetup.id },
        select: { movieListId: true },
      })
      console.log(tag, 'txn.check', {
        meetupId: meetup.id,
        movieListId: fresh?.movieListId ?? null,
      })
      if (fresh?.movieListId) {
        console.log(tag, 'txn.abort.already-linked', {
          meetupId: meetup.id,
          movieListId: fresh.movieListId,
        })
        return
      }
      await tx.meetup.update({ where: { id: meetup.id }, data: { movieListId: ballotId } })
      console.log(tag, 'txn.update.success', { meetupId: meetup.id, setMovieListId: ballotId })
    })

    return done({ ran: true, linkedListId: ballotId })
  } catch (error) {
    console.error(tag, 'error', { message: error instanceof Error ? error.message : String(error) })
    return done({ ran: false, reason: 'error' })
  }
}
