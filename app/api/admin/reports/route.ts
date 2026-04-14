import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function resolveReportedContent(itemType: string, itemId: string) {
  try {
    switch (itemType) {
      case "FORUM_POST": {
        const post = await prisma.forumPost.findUnique({
          where: { id: itemId },
          select: { title: true, content: true, user: { select: { name: true } } },
        })
        return post ? { title: post.title, content: post.content.substring(0, 200), author: post.user.name } : null
      }
      case "FORUM_REPLY": {
        const reply = await prisma.forumReply.findUnique({
          where: { id: itemId },
          select: { content: true, user: { select: { name: true } }, ForumPost: { select: { title: true } } },
        })
        return reply ? { title: reply.ForumPost.title, content: reply.content.substring(0, 200), author: reply.user.name } : null
      }
      case "VIDEO_COMMENT": {
        const comment = await prisma.comment.findUnique({
          where: { id: itemId },
          select: { content: true, user: { select: { name: true } }, video: { select: { title: true } } },
        })
        return comment ? { title: comment.video.title, content: comment.content.substring(0, 200), author: comment.user.name } : null
      }
      default:
        return null
    }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = 20

  const where = status ? { status: status as "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED" } : {}

  const [reports, total] = await Promise.all([
    prisma.contentReport.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contentReport.count({ where }),
  ])

  const enrichedReports = await Promise.all(
    reports.map(async (report) => {
      const reportedContent = await resolveReportedContent(report.itemType, report.itemId)
      return { ...report, reportedContent }
    })
  )

  return NextResponse.json({ reports: enrichedReports, total, page, totalPages: Math.ceil(total / limit) })
}
