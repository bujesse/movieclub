import { NextRequest, NextResponse } from 'next/server'
import { getIdentityFromRequest } from '../../../../../lib/cfAccess'
import { prisma } from '../../../../../lib/prisma'

// GET all comments for a list
export async function GET(req: NextRequest, { params }: { params: any }) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const movieListId = Number(params.id)

  try {
    const comments = await prisma.comment.findMany({
      where: { movieListId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (err) {
    console.error('Failed to fetch comments:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST a new comment
export async function POST(req: NextRequest, { params }: { params: any }) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const movieListId = Number(params.id)

  try {
    const { text } = await req.json()

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        movieListId,
        userId: user.email,
        text: text.trim(),
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error('Failed to create comment:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
