import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { itemType, itemId, reason, message } = await request.json()

  if (!itemType || !itemId || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const validTypes = ["FORUM_POST", "FORUM_REPLY", "VIDEO_COMMENT"]
  const validReasons = ["SPAM", "HARASSMENT", "INAPPROPRIATE", "MISINFORMATION", "OTHER"]

  if (!validTypes.includes(itemType) || !validReasons.includes(reason)) {
    return NextResponse.json({ error: "Invalid type or reason" }, { status: 400 })
  }

  const report = await prisma.contentReport.create({
    data: {
      reporterId: session.user.id,
      itemType,
      itemId,
      reason,
      message: message || null,
    },
  })

  return NextResponse.json({ report }, { status: 201 })
}
