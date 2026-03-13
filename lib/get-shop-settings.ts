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
  }
  productDetail: {
    trustBadges: ShopSettingsTrustBadge[]
    careInstructions: ShopSettingsCareInstruction[]
    faq: {
      enabled: boolean
      items: ShopSettingsFaqItem[]
    }
  }
}

const DEFAULT_SETTINGS: ShopSettings = {
  banner: {
    imageUrl: "/images/shop.jpg",
    alt: "Tienda",
  },
  hero: {
    enabled: true,
    backgroundImageUrl: null,
    badgeText: "NUEVA COLECCION",
    title: "Descubre Nuestra Tienda",
    subtitle: "Encuentra los mejores productos con envio discreto y garantia de calidad",
    ctaPrimaryText: "Comprar Ahora",
    ctaPrimaryUrl: "/tienda#productos",
    ctaSecondaryText: "Ver Colecciones",
    ctaSecondaryUrl: "/tienda#colecciones",
  },
  trustIcons: {
    enabled: true,
    items: [
      { icon: "Package", label: "Envio Discreto" },
      { icon: "Shield", label: "Pago Seguro" },
      { icon: "Lock", label: "Privacidad Garantizada" },
      { icon: "RotateCcw", label: "Devolucion 30 Dias" },
    ],
  },
  featuredCollections: {
    enabled: true,
    title: "Colecciones Destacadas",
    subtitle: "Explora nuestras categorias mas populares",
    categoryIds: [],
  },
  reviews: {
    enabled: true,
    title: "Lo Que Dicen Nuestros Clientes",
    items: [
      { name: "Maria G.", rating: 5, text: "Excelente calidad y envio muy discreto. Totalmente recomendable." },
      { name: "Carlos R.", rating: 5, text: "Muy buena experiencia de compra. El producto llego perfecto." },
      { name: "Laura P.", rating: 4, text: "Gran variedad de productos y atencion al cliente impecable." },
    ],
  },
  faq: {
    enabled: true,
    title: "Preguntas Frecuentes",
    items: [
      { question: "¿Cual es el tiempo de envio?", answer: "Los pedidos se envian en 24-48h laborables. El envio es completamente discreto sin marcas identificativas." },
      { question: "¿Puedo devolver un producto?", answer: "Si, tienes 30 dias para devolver cualquier producto sin abrir en su embalaje original." },
      { question: "¿Es seguro comprar aqui?", answer: "Absolutamente. Utilizamos encriptacion SSL y pasarelas de pago seguras para proteger tus datos." },
      { question: "¿El envio es discreto?", answer: "Si, todos los envios son completamente discretos. El paquete no contiene ninguna marca o referencia al contenido." },
    ],
  },
  productDetail: {
    trustBadges: [
      { icon: "Shield", label: "Pago 100% Seguro" },
      { icon: "Truck", label: "Envio Discreto" },
      { icon: "Package", label: "Embalaje Privado" },
      { icon: "RotateCcw", label: "Devolucion 30 Dias" },
    ],
    careInstructions: [
      { title: "Limpieza", description: "Limpiar con agua tibia y jabon neutro antes y despues de cada uso." },
      { title: "Almacenamiento", description: "Guardar en un lugar seco y fresco, preferiblemente en su estuche original." },
      { title: "Proteccion", description: "Evitar la exposicion directa al sol y a temperaturas extremas." },
    ],
    faq: {
      enabled: true,
      items: [
        { question: "¿Cual es el tiempo de envio?", answer: "Los pedidos se envian en 24-48h laborables con envio discreto." },
        { question: "¿Tiene garantia?", answer: "Si, todos nuestros productos tienen garantia de calidad." },
        { question: "¿Puedo devolver el producto?", answer: "Si, tienes 30 dias para devolver productos sin abrir." },
      ],
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
