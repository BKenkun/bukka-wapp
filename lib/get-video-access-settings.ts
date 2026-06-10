import { prisma } from "@/lib/prisma"

export interface VideoAccessLockConfig {
  title: string
  description: string
  buttonText: string
  buttonUrl: string
  backgroundImage: string | null
  overlaySize: "compact" | "normal" | "large"
  showTierBadge: boolean
  // Title styling
  titleFontSize: string
  titleFontWeight: string
  // Description styling
  descriptionFontSize: string
  descriptionFontWeight: string
  // Button styling
  buttonBgColor: string
  buttonHoverBgColor: string
  buttonTextColor: string
  buttonBorderRadius: string
  buttonPaddingX: string
  buttonPaddingY: string
  // Tier badge styling
  tierBadgeTextColor: string
  tierBadgeAccentColor: string
  // Lock reason messages (texto principal del aviso según el motivo del bloqueo)
  messageLockedByTier: string
  messageLockedByExclusive: string
  messageLockedByEarlyAccess: string
  messageLockedByNoSession: string
}

export interface VideoAccessSettings {
  lockScreen: VideoAccessLockConfig
}

const SETTINGS_KEY = "video_access_settings"

export const defaultVideoAccessSettings: VideoAccessSettings = {
  lockScreen: {
    title: "Access Denied",
    description: "This content requires a subscription",
    buttonText: "View Plans",
    buttonUrl: "/suscripciones",
    backgroundImage: null,
    overlaySize: "normal",
    showTierBadge: true,
    // Title styling defaults
    titleFontSize: "text-xl",
    titleFontWeight: "font-bold",
    // Description styling defaults
    descriptionFontSize: "text-base",
    descriptionFontWeight: "font-normal",
    // Button styling defaults
    buttonBgColor: "#FA4860",
    buttonHoverBgColor: "#e03d53",
    buttonTextColor: "#FFFFFF",
    buttonBorderRadius: "rounded-none",
    buttonPaddingX: "px-6",
    buttonPaddingY: "py-3",
    // Tier badge: por defecto lee los colores del tema (Settings → Diseño → Videos → Acceso Denegado).
    // Si el admin quiere un override específico de este overlay puede poner un HEX/rgba aquí.
    tierBadgeTextColor: "var(--access-denied-text-color)",
    tierBadgeAccentColor: "var(--access-denied-accent-color)",
    // Lock messages — se muestran como descripción del overlay según el motivo
    messageLockedByTier: "This content requires a higher subscription",
    messageLockedByExclusive: "Exclusive content for Diamond subscribers",
    messageLockedByEarlyAccess: "Early access for Platinum+ subscribers",
    messageLockedByNoSession: "Log in to view this content",
  },
}

export async function getVideoAccessSettings(): Promise<VideoAccessSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!settings?.value) {
      return defaultVideoAccessSettings
    }

    const value = settings.value as Partial<VideoAccessSettings>

    return {
      lockScreen: {
        ...defaultVideoAccessSettings.lockScreen,
        ...value.lockScreen,
      },
    }
  } catch (error) {
    console.error("Error fetching video access settings:", error)
    return defaultVideoAccessSettings
  }
}

export function getLockScreenConfig(
  settings: VideoAccessSettings | null
): VideoAccessLockConfig {
  return settings?.lockScreen ?? defaultVideoAccessSettings.lockScreen
}
