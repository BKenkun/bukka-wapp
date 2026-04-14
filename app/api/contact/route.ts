import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email/send-email"
import { ContactNotificationEmail } from "@/lib/email/templates/contact/notification"
import { render } from "@react-email/components"

const SETTINGS_KEY = "contact_settings"

const DEFAULT_SETTINGS = {
  recipientEmail: "soporte@bukkakery.com",
  subjectPrefix: "[Contact]",
  autoReply: false,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message, gdprConsent } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate GDPR consent
    if (!gdprConsent) {
      return NextResponse.json(
        { error: "You must accept the privacy policy to send a message" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Rate limiting: max 3 messages per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await prisma.contactMessage.count({
      where: {
        email,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
      )
    }

    // Get IP address
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null

    // Save to database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        ipAddress,
      },
    })

    // Load contact settings
    let settings = DEFAULT_SETTINGS
    try {
      const dbSettings = await prisma.siteSettings.findUnique({
        where: { key: SETTINGS_KEY },
      })
      if (dbSettings?.value) {
        settings = { ...DEFAULT_SETTINGS, ...(dbSettings.value as Record<string, unknown>) } as typeof DEFAULT_SETTINGS
      }
    } catch {
      // Use defaults
    }

    // Send notification email to admin
    try {
      const html = await render(
        ContactNotificationEmail({
          name,
          email,
          subject,
          message,
          createdAt: contactMessage.createdAt.toISOString(),
        })
      )

      await sendEmail({
        to: settings.recipientEmail,
        subject: `${settings.subjectPrefix} ${subject}`,
        html,
        template: "contact/notification",
      })
    } catch (error) {
      console.error("Failed to send contact notification email:", error)
      // Don't fail the request if email fails - the message is already saved
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
