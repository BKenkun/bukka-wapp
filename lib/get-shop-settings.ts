import { prisma } from "@/lib/prisma"

const SETTINGS_KEY = "shop_settings"

export interface ShopSettingsHero {
  enabled: boolean
  backgroundImageUrl: string | null
  badgeText: string
  title: string
  subtitle: string
  ctaPrimaryText: string
  ctaPrimaryUrl: string
  ctaSecondaryText: string
  ctaSecondaryUrl: string
}

export interface ShopSettingsTrustIcon {
  icon: string
  label: string
}

export interface ShopSettingsReviewItem {
  name: string
  rating: number
  text: string
}

export interface ShopSettingsFaqItem {
  question: string
  answer: string
}

export interface ShopSettingsCareInstruction {
  title: string
  description: string
}

export interface ShopSettingsTrustBadge {
  icon: string
  label: string
}

export interface SectionStyles {
  bgColor: string
  titleColor: string
  iconColor?: string
  iconBgColor?: string
  cardBgColor?: string
  textColor?: string
}

export interface ShopSettings {
  banner: {
    imageUrl: string | null
    alt: string
  }
  hero: ShopSettingsHero
  trustIcons: {
    enabled: boolean
    items: ShopSettingsTrustIcon[]
  }
  featuredCollections: {
    enabled: boolean
    title: string
    subtitle: string
    categoryIds: string[]
  }
  reviews: {
    enabled: boolean
    title: string
    items: ShopSettingsReviewItem[]
  }
  faq: {
    enabled: boolean
    title: string
    items: ShopSettingsFaqItem[]
    styles: SectionStyles
  }
  productDetail: {
    trustBadges: ShopSettingsTrustBadge[]
    trustBadgesStyles: SectionStyles
    careInstructions: ShopSettingsCareInstruction[]
    careInstructionsStyles: SectionStyles
    faq: {
      enabled: boolean
      items: ShopSettingsFaqItem[]
      styles: SectionStyles
    }
    relatedProductsStyles: SectionStyles
  }
}

const DEFAULT_SETTINGS: ShopSettings = {
  banner: {
    imageUrl: "/images/shop.jpg",
    alt: "Shop",
  },
  hero: {
    enabled: true,
    backgroundImageUrl: null,
    badgeText: "NEW COLLECTION",
    title: "Discover Our Shop",
    subtitle: "Find the best products with discreet shipping and quality guarantee",
    ctaPrimaryText: "Buy Now",
    ctaPrimaryUrl: "/shop#productos",
    ctaSecondaryText: "View Collections",
    ctaSecondaryUrl: "/shop#colecciones",
  },
  trustIcons: {
    enabled: true,
    items: [
      { icon: "Package", label: "Discreet Shipping" },
      { icon: "Shield", label: "Secure Payment" },
      { icon: "Lock", label: "Guaranteed Privacy" },
      { icon: "RotateCcw", label: "30-Day Returns" },
    ],
  },
  featuredCollections: {
    enabled: true,
    title: "Featured Collections",
    subtitle: "Explore our most popular categories",
    categoryIds: [],
  },
  reviews: {
    enabled: true,
    title: "What Our Customers Say",
    items: [
      { name: "Maria G.", rating: 5, text: "Excellent quality and very discreet shipping. Totally recommended." },
      { name: "Carlos R.", rating: 5, text: "Great shopping experience. The product arrived in perfect condition." },
      { name: "Laura P.", rating: 4, text: "Wide variety of products and impeccable customer service." },
    ],
  },
  faq: {
    enabled: true,
    title: "Frequently Asked Questions",
    items: [
      { question: "What is the shipping time?", answer: "Orders ship within 24-48 business hours. Shipping is completely discreet with no identifying marks." },
      { question: "Can I return a product?", answer: "Yes, you have 30 days to return any unopened product in its original packaging." },
      { question: "Is it safe to shop here?", answer: "Absolutely. We use SSL encryption and secure payment gateways to protect your data." },
      { question: "Is shipping discreet?", answer: "Yes, all shipments are completely discreet. The package contains no branding or reference to the contents." },
    ],
    styles: {
      bgColor: "",
      titleColor: "",
    },
  },
  productDetail: {
    trustBadges: [
      { icon: "Shield", label: "100% Secure Payment" },
      { icon: "Truck", label: "Discreet Shipping" },
      { icon: "Package", label: "Private Packaging" },
      { icon: "RotateCcw", label: "30-Day Returns" },
    ],
    trustBadgesStyles: {
      bgColor: "",
      titleColor: "",
      iconColor: "",
      iconBgColor: "",
    },
    careInstructions: [
      { title: "Cleaning", description: "Clean with warm water and neutral soap before and after each use." },
      { title: "Storage", description: "Store in a cool, dry place, preferably in its original case." },
      { title: "Protection", description: "Avoid direct sunlight and extreme temperatures." },
    ],
    careInstructionsStyles: {
      bgColor: "",
      titleColor: "",
      cardBgColor: "",
      textColor: "",
    },
    faq: {
      enabled: true,
      items: [
        { question: "What is the shipping time?", answer: "Orders ship within 24-48 business hours with discreet shipping." },
        { question: "Does it have a warranty?", answer: "Yes, all our products come with a quality guarantee." },
        { question: "Can I return the product?", answer: "Yes, you have 30 days to return unopened products." },
      ],
      styles: {
        bgColor: "",
        titleColor: "",
      },
    },
    relatedProductsStyles: {
      bgColor: "",
      titleColor: "",
    },
  },
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target } as Record<string, unknown>
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      )
    } else if (source[key] !== undefined) {
      result[key] = source[key]
    }
  }
  return result
}

export async function getShopSettings(): Promise<ShopSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!settings) {
      return DEFAULT_SETTINGS
    }

    const savedSettings = settings.value as unknown as Record<string, unknown>
    return deepMerge(DEFAULT_SETTINGS as unknown as Record<string, unknown>, savedSettings) as unknown as ShopSettings
  } catch (error) {
    console.error("Error fetching shop settings:", error)
    return DEFAULT_SETTINGS
  }
}
