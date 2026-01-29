import { prisma } from "@/lib/prisma"

const SETTINGS_KEY = "shop_settings"

export interface ShopSettings {
  banner: {
    imageUrl: string | null
    alt: string
  }
}

const DEFAULT_SETTINGS: ShopSettings = {
  banner: {
    imageUrl: "/images/shop.jpg",
    alt: "Tienda",
  },
}

export async function getShopSettings(): Promise<ShopSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!settings) {
      return DEFAULT_SETTINGS
    }

    const savedSettings = settings.value as unknown as ShopSettings
    return {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
      banner: { ...DEFAULT_SETTINGS.banner, ...savedSettings.banner },
    }
  } catch (error) {
    console.error("Error fetching shop settings:", error)
    return DEFAULT_SETTINGS
  }
}
