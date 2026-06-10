import { prisma } from "@/lib/prisma"

interface SiteSettings {
  site: {
    name: string
    seoTitle: string
    seoDescription: string
    favicon: string
    supportEmail: string
    maintenanceMode: boolean
  }
  discountBanner: {
    enabled: boolean
    text: string
    buttonText: string
    buttonUrl: string
    backgroundColor: string
  }
}

const DEFAULT_SETTINGS: SiteSettings = {
  site: {
    name: "BUKKAKERY",
    seoTitle: "",
    seoDescription: "",
    favicon: "",
    supportEmail: "",
    maintenanceMode: false,
  },
  discountBanner: {
    enabled: true,
    text: "SPECIAL DISCOUNT FOR DIAMOND MEMBERS -30%",
    buttonText: "SUBSCRIBE NOW",
    buttonUrl: "/registro",
    backgroundColor: "#00B1DE",
  },
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: "general_settings" },
    })

    if (!settings) {
      return DEFAULT_SETTINGS
    }

    const value = settings.value as unknown as SiteSettings
    return {
      site: { ...DEFAULT_SETTINGS.site, ...value.site },
      discountBanner: { ...DEFAULT_SETTINGS.discountBanner, ...value.discountBanner },
    }
  } catch (error) {
    console.error("Error fetching site settings:", error)
    return DEFAULT_SETTINGS
  }
}

export async function getSeoMetadata() {
  const settings = await getSiteSettings()

  return {
    title: settings.site.seoTitle || settings.site.name || "BUKKAKERY",
    description: settings.site.seoDescription || "",
    siteName: settings.site.name || "BUKKAKERY",
    favicon: settings.site.favicon || "",
  }
}
