import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const SETTINGS_KEY = "contact_settings"

const DEFAULT_SETTINGS = {
  recipientEmail: "soporte@bukkakery.com",
  subjectPrefix: "[Contact]",
  autoReply: false,
  autoReplySubject: "We received your message",
  autoReplyMessage: "Thank you for contacting us. We will get back to you within 24-48 hours.",
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS)
    }

    return NextResponse.json({ ...DEFAULT_SETTINGS, ...(settings.value as Record<string, unknown>) })
  } catch (error) {
    console.error("Error fetching contact settings:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    const settingsData = {
      recipientEmail: body.recipientEmail || DEFAULT_SETTINGS.recipientEmail,
      subjectPrefix: body.subjectPrefix || DEFAULT_SETTINGS.subjectPrefix,
      autoReply: body.autoReply ?? DEFAULT_SETTINGS.autoReply,
      autoReplySubject: body.autoReplySubject || DEFAULT_SETTINGS.autoReplySubject,
      autoReplyMessage: body.autoReplyMessage || DEFAULT_SETTINGS.autoReplyMessage,
    }

    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: settingsData },
      update: { value: settingsData },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving contact settings:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
