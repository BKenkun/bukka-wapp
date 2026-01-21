import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const SETTINGS_KEY = "footer_settings"

export interface FooterSocialLink {
  id: string
  svg: string
  url: string
  label: string
}

export interface FooterSettings {
  logo: {
    type: "image" | "text"
    imageUrl: string | null
    text: string
  }
  newsletter: {
    title: string
    titleUrl: string | null
    openInNewTab: boolean
    customHtml: string
  }
  followUs: {
    title: string
    socialLinks: FooterSocialLink[]
  }
  copyright: {
    text: string
  }
  disclaimer: {
    text: string
  }
}

const DEFAULT_SETTINGS: FooterSettings = {
  logo: {
    type: "text",
    imageUrl: null,
    text: "BUKKAKERY",
  },
  newsletter: {
    title: "CASTINGS",
    titleUrl: null,
    openInNewTab: false,
    customHtml: "",
  },
  followUs: {
    title: "SÍGUENOS",
    socialLinks: [],
  },
  copyright: {
    text: "© {year} . All Rights Reserved.",
  },
  disclaimer: {
    text: "All performers appearing on this website are 18 years or older. All video, images, design, graphics are copyright. For inquiries or to cancel your membership, please visit [Tu URL de Contacto/Soporte] or contact our authorized sales agents. 18 U.S.C. §§ 2257–2257A Record-Keeping Compliance Statement (Link a /declaracion-2257)",
  },
}

// GET - Obtener configuración del footer
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS)
    }

    // Merge with defaults to ensure all fields exist
    const savedSettings = settings.value as unknown as FooterSettings
    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      ...savedSettings,
      logo: { ...DEFAULT_SETTINGS.logo, ...savedSettings.logo },
      newsletter: { ...DEFAULT_SETTINGS.newsletter, ...savedSettings.newsletter },
      followUs: { ...DEFAULT_SETTINGS.followUs, ...savedSettings.followUs },
      copyright: { ...DEFAULT_SETTINGS.copyright, ...savedSettings.copyright },
      disclaimer: { ...DEFAULT_SETTINGS.disclaimer, ...savedSettings.disclaimer },
    })
  } catch (error) {
    console.error("Error fetching footer settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

// POST - Guardar configuración del footer
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()

    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: body,
      },
      update: {
        value: body,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving footer settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
