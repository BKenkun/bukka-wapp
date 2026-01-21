import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_EMAIL_SETTINGS, type EmailSettings } from "@/lib/email/types"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { key: "email_settings" },
    })

    const emailSettings = settings?.value
      ? { ...DEFAULT_EMAIL_SETTINGS, ...(settings.value as unknown as EmailSettings) }
      : DEFAULT_EMAIL_SETTINGS

    return NextResponse.json(emailSettings)
  } catch (error) {
    console.error("Error fetching email settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    await prisma.siteSettings.upsert({
      where: { key: "email_settings" },
      update: { value: body },
      create: { key: "email_settings", value: body },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving email settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
