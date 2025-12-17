import { NextRequest, NextResponse } from 'next/server'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import { prisma } from '../../../../lib/prisma'
import '../../../../lib/bigintSerializer'

// DELETE a comment (only own comments or admin)
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const commentId = Number(params.id)

  try {
    // First, find the comment to check ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user owns the comment or is admin
    if (comment.userId !== user.email && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Failed to delete comment:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
