import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPlan, canUserAccessForum } from "@/lib/subscription-guard"

interface RouteParams {
  params: Promise<{ pollId: string }>
}

async function getPollState(pollId: string, userId: string) {
  const options = await prisma.forumPollOption.findMany({
    where: { pollId },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { votes: true } },
      votes: { where: { userId }, select: { id: true } },
    },
  })

  const mapped = options.map((option) => ({
    id: option.id,
    text: option.text,
    votes: option._count.votes,
    votedByMe: option.votes.length > 0,
  }))

  return {
    options: mapped,
    totalVotes: mapped.reduce((sum, option) => sum + option.votes, 0),
  }
}

// POST - Vote / unvote a poll option (toggle)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    // Check forum access
    const userPlan = await getUserPlan(session.user.id)
    if (!canUserAccessForum(userPlan)) {
      return NextResponse.json(
        { error: "You need a Gold subscription or higher to access the forum" },
        { status: 403 }
      )
    }

    const { pollId } = await params
    const userId = session.user.id

    const body = await request.json()
    const { optionId } = body

    if (!optionId || typeof optionId !== "string") {
      return NextResponse.json({ error: "Option is required" }, { status: 400 })
    }

    // Validate option belongs to this poll
    const option = await prisma.forumPollOption.findUnique({
      where: { id: optionId },
      include: { poll: true },
    })

    if (!option || option.pollId !== pollId) {
      return NextResponse.json({ error: "Option not found in this poll" }, { status: 404 })
    }

    // Check poll has not ended
    if (option.poll.endsAt && option.poll.endsAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "This poll has ended" }, { status: 403 })
    }

    const existingVote = await prisma.forumPollVote.findUnique({
      where: { optionId_userId: { optionId, userId } },
    })

    if (existingVote) {
      // Toggle off - remove the vote
      await prisma.forumPollVote.delete({ where: { id: existingVote.id } })
    } else {
      if (!option.poll.multiple) {
        // Single-choice poll: remove any previous vote on other options of this poll
        await prisma.forumPollVote.deleteMany({
          where: { userId, option: { pollId } },
        })
      }
      await prisma.forumPollVote.create({
        data: { optionId, userId },
      })
    }

    const state = await getPollState(pollId, userId)
    return NextResponse.json(state)
  } catch (error) {
    console.error("Error voting in poll:", error)
    return NextResponse.json({ error: "Error processing vote" }, { status: 500 })
  }
}
