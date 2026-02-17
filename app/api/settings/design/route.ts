import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Complete default theme settings - values match current hardcoded styles
const defaultTheme = {
  global: {
    backgroundColor: "#000000",
    fontFamily: "Montserrat",
    brandColor: "#FA4860",
    brandColorHover: "#E03E54",
    accentColor: "#00B1DE",
    textPrimary: "#FFFFFF",
    textSecondary: "#E0E0E0",
    textMuted: "#999999",
    linkColor: "#FA4860",
    surfaceBg: "#1a1a1a",
    borderColor: "#262626",
    successColor: "#16A34A",
    errorColor: "#DC2626",
    warningColor: "#EAB308",
  },
  topBar: {
    backgroundColor: "#353535",
    textColor: "#FFFFFF",
    fontSize: "16",
    fontWeight: "700",
    height: "36",
    iconColor: "#FFFFFF",
  },
  header: {
    navTextColor: "#FFFFFF",
    navFontSize: "16",
    navFontWeight: "700",
    navHoverColor: "#FA4860",
    logoColor: "#FA4860",
  },
  sectionHeaders: {
    textColor: "#FFFFFF",
    fontSize: "16",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    lineColor: "#FFFFFF",
    lineHeight: "1",
    backgroundColor: "#000000",
  },
  videoCards: {
    titleColor: "#FFFFFF",
    titleFontSize: "18",
    titleFontWeight: "700",
    metaColor: "#999999",
    metaFontSize: "14",
    hoverAccentColor: "#FA4860",
  },
  performerCards: {
    nameColor: "#E0E0E0",
    nameFontSize: "20",
    nameFontWeight: "400",
    statsColor: "#B3B3B3",
    verifiedColor: "#00aaff",
  },
  ctaBanner: {
    titleColor: "#FFFFFF",
    titleFontSize: "32",
    descriptionColor: "#FFFFFF",
    descriptionFontSize: "18",
    overlayOpacity: "0.4",
  },
  countdown: {
    titleColor: "#FFFFFF",
    titleFontSize: "32",
    subtitleColor: "#FFFFFF",
    numberColor: "#FFFFFF",
    numberFontSize: "48",
    labelColor: "#CCCCCC",
    separatorColor: "#4D4D4D",
  },
  footer: {
    backgroundColor: "#000000",
    titleColor: "#FFFFFF",
    titleFontSize: "18",
    titleFontWeight: "700",
    linkColor: "#FFFFFF",
    linkHoverColor: "#D1D5DB",
    linkFontSize: "14",
    copyrightColor: "#FFFFFF",
    disclaimerLinkColor: "#FA4860",
    borderColor: "#1A1A1A",
    newsletterInputBg: "#262626",
    newsletterButtonBg: "#FA4860",
    socialIconColor: "#FFFFFF",
  },
  forms: {
    inputBg: "#000000",
    inputBorder: "#333333",
    inputText: "#FFFFFF",
    inputFocusBorder: "#FA4860",
    labelColor: "#9CA3AF",
  },
  cart: {
    itemNameColor: "#FFFFFF",
    itemMetaColor: "#999999",
    priceColor: "#FA4860",
    quantityBorderColor: "#333333",
    quantityButtonHoverBg: "#1A1A1A",
    summaryLabelColor: "#9CA3AF",
    removeButtonColor: "#9CA3AF",
    removeButtonHoverColor: "#DC2626",
    emptyIconColor: "#333333",
    emptyTextColor: "#9CA3AF",
    trustBadgeColor: "#9CA3AF",
  },
  buttons: {
    primary: {
      backgroundColor: "#FA4860",
      textColor: "#FFFFFF",
      borderRadius: "0",
      fontSize: "16",
      fontWeight: "500",
      padding: "10px 28px",
      hoverBackgroundColor: "#E03E54",
      hoverTextColor: "#FFFFFF",
    },
    secondary: {
      backgroundColor: "transparent",
      textColor: "#FA4860",
      borderRadius: "0",
      fontSize: "16",
      fontWeight: "500",
      padding: "10px 28px",
      borderColor: "#FA4860",
      borderWidth: "2",
      hoverBackgroundColor: "#FA4860",
      hoverTextColor: "#FFFFFF",
    },
  },
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>)
    } else {
      result[key] = source[key]
    }
  }
  return result
}

export async function GET() {
  try {
    // Try new key first
    const themeSetting = await prisma.siteSettings.findUnique({
      where: { key: "design_theme" },
    })

    if (themeSetting?.value) {
      const theme = deepMerge(defaultTheme as unknown as Record<string, unknown>, themeSetting.value as Record<string, unknown>)
      return NextResponse.json({ theme })
    }

    // Backwards compat: check old key
    const buttonsSetting = await prisma.siteSettings.findUnique({
      where: { key: "design_buttons" },
    })

    if (buttonsSetting?.value) {
      const theme = deepMerge(defaultTheme as unknown as Record<string, unknown>, {
        buttons: buttonsSetting.value,
      } as Record<string, unknown>)
      return NextResponse.json({ theme })
    }

    return NextResponse.json({ theme: defaultTheme })
  } catch (error) {
    console.error("Error loading design settings:", error)
    return NextResponse.json({ theme: defaultTheme })
  }
}
