import { prisma } from "@/lib/prisma"

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
    placeholder: string
    buttonText: string
    privacyText: string
    privacyLinkText: string
    privacyLinkUrl: string | null
    privacyLinkPageId: string | null
    privacyLinkOpenInNewTab: boolean
    customHtml: string | null
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
    title: "NEWSLETTER",
    titleUrl: null,
    openInNewTab: false,
    placeholder: "Enter your email",
    buttonText: "Sign up",
    privacyText: "I have read and agree to the",
    privacyLinkText: "privacy policy",
    privacyLinkUrl: null,
    privacyLinkPageId: null,
    privacyLinkOpenInNewTab: false,
    customHtml: null,
  },
  followUs: {
    title: "FOLLOW US",
    socialLinks: [],
  },
  copyright: {
    text: "© {year} . All Rights Reserved.",
  },
  disclaimer: {
    text: "All performers appearing on this website are 18 years or older. All video, images, design, graphics are copyright. For inquiries or to cancel your membership, please visit [Tu URL de Contacto/Soporte] or contact our authorized sales agents. 18 U.S.C. §§ 2257–2257A Record-Keeping Compliance Statement (Link a /declaracion-2257)",
  },
}

export async function getFooterSettings(): Promise<FooterSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: "footer_settings" },
    })

    if (!settings) {
      return DEFAULT_SETTINGS
    }

    const savedSettings = settings.value as unknown as FooterSettings

    // Merge with defaults to ensure all fields exist
    return {
      logo: { ...DEFAULT_SETTINGS.logo, ...savedSettings.logo },
      newsletter: { ...DEFAULT_SETTINGS.newsletter, ...savedSettings.newsletter },
      followUs: { ...DEFAULT_SETTINGS.followUs, ...savedSettings.followUs },
      copyright: { ...DEFAULT_SETTINGS.copyright, ...savedSettings.copyright },
      disclaimer: { ...DEFAULT_SETTINGS.disclaimer, ...savedSettings.disclaimer },
    }
  } catch (error) {
    console.error("Error fetching footer settings:", error)
    return DEFAULT_SETTINGS
  }
}
