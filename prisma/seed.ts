import { PrismaClient, BadgeType, HomeSectionType } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hash } from "bcryptjs"
import { config } from "dotenv"
import path from "node:path"

// Load environment variables
config({ path: path.join(__dirname, "../.env.local") })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined")
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // 1. Subscription Plans (dynamic, no enum)
  console.log("📋 Creating subscription plans...")
  const plans = [
    {
      slug: "visitante",
      name: "Visitante",
      description: "sin cuenta creada o no logueado",
      level: 0,
      icon: "eye",
      monthlyPrice: 0,
      features: [
        { text: "Exploración de la web.", included: true },
        { text: "Visualización limitada de contenido.", included: true },
        { text: "Puede comprar en la tienda.", included: true },
        { text: "No puede comentar.", included: false },
        { text: "No puede ampliar las galerías.", included: false },
        { text: "No puede ver más de 3 trailers.", included: false },
      ],
      maxVideoQuality: "720p",
      canComment: false,
      canAccessForum: false,
      canDownload: false,
      canAccessLimitedEdition: false,
      canAccessExclusive: false,
      shopDiscount: 0,
      includesVIPPack: false,
      isDefault: true,
      isFree: true,
    },
    {
      slug: "free",
      name: "Free",
      description: "Con cuenta creada y log in realizado",
      level: 1,
      icon: "user",
      monthlyPrice: 0,
      features: [
        { text: "Exploración de la web.", included: true },
        { text: "Visualización de contenido.", included: true },
        { text: "Puede comprar en la tienda.", included: true },
        { text: "No puede comentar.", included: false },
        { text: "No puede ampliar las galerías.", included: false },
        { text: "No puede ver más de 3 trailers.", included: false },
      ],
      maxVideoQuality: "720p",
      canComment: false,
      canAccessForum: false,
      canDownload: false,
      canAccessLimitedEdition: false,
      canAccessExclusive: false,
      shopDiscount: 0,
      includesVIPPack: false,
      isDefault: false,
      isFree: true,
    },
    {
      slug: "premium",
      name: "Premium",
      description: "",
      level: 2,
      icon: "star",
      monthlyPrice: 29,
      features: [
        { text: "Calendario de actualización de contenido.", included: true },
        { text: "Streaming ilimitado de todo el material disponible (textos, fotos, vídeos).", included: true },
        { text: "Compatibilidad con móviles y tabletas.", included: true },
        { text: "Vídeos y fotos en 1080p.", included: true },
        { text: "Asistencia para miembros 24 horas.", included: true },
        { text: "NO incluye acceso a foros ni la capacidad de publicar comentarios.", included: false },
      ],
      maxVideoQuality: "1080p",
      canComment: false,
      canAccessForum: false,
      canDownload: false,
      canAccessLimitedEdition: false,
      canAccessExclusive: false,
      shopDiscount: 0,
      includesVIPPack: false,
      isDefault: false,
      isFree: false,
    },
    {
      slug: "gold",
      name: "Gold",
      description: "",
      level: 3,
      icon: "crown",
      monthlyPrice: 42.95,
      features: [
        { text: "Todas las de Silver", included: true },
        { text: "Foros para miembro", included: true },
        { text: "Capacidad para publicar comentarios.", included: true },
        { text: "Vídeos y fotos en UHD 4K.", included: true },
        { text: "Descarga premium de vídeos.", included: true },
      ],
      maxVideoQuality: "4k",
      canComment: true,
      canAccessForum: true,
      canDownload: true,
      canAccessLimitedEdition: false,
      canAccessExclusive: false,
      shopDiscount: 0,
      includesVIPPack: false,
      isDefault: false,
      isFree: false,
    },
    {
      slug: "platinum",
      name: "Platinum",
      description: "",
      level: 4,
      icon: "gem",
      monthlyPrice: 46.45,
      features: [
        { text: "Características: Todas las de Gold", included: true },
        { text: "Acceso a Vídeos de Edición Limitada en streaming desde su publicación (estos vídeos se harán públicos para todos los miembros 15 días después).", included: true },
        { text: "Descuento del 5% en la tienda de artículos de coleccionista.", included: true },
      ],
      maxVideoQuality: "4k",
      canComment: true,
      canAccessForum: true,
      canDownload: true,
      canAccessLimitedEdition: true,
      canAccessExclusive: false,
      shopDiscount: 5,
      includesVIPPack: false,
      isDefault: false,
      isFree: false,
    },
    {
      slug: "diamond",
      name: "Diamond",
      description: "",
      level: 5,
      icon: "diamond",
      monthlyPrice: 54.96,
      features: [
        { text: "Características: Todas las de Platinum", included: true },
        { text: "Acceso anticipado a Vídeos de Edición Limitada con opción de descarga.", included: true },
        { text: "Vídeos Exclusivos Diamond (contenido no disponible para otros miembros) con opción de descarga.", included: true },
        { text: "Un Paquete VIP secreto.", included: true },
        { text: "Descuento del 8% en la tienda de artículos de coleccionista.", included: true },
      ],
      maxVideoQuality: "4k",
      canComment: true,
      canAccessForum: true,
      canDownload: true,
      canAccessLimitedEdition: true,
      canAccessExclusive: true,
      shopDiscount: 8,
      includesVIPPack: true,
      isDefault: false,
      isFree: false,
    },
  ]

  // Store plan IDs for later use
  const planIdsBySlug: Record<string, string> = {}

  for (const plan of plans) {
    const created = await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    })
    planIdsBySlug[plan.slug] = created.id
  }

  // 2. Badges
  console.log("🏅 Creating badges...")
  const badges = [
    // Subscription badges
    { slug: "silver-member", name: "Silver", description: "Miembro Silver activo", type: BadgeType.SUBSCRIPTION, color: "#C0C0C0", autoAward: true },
    { slug: "gold-member", name: "Gold", description: "Miembro Gold activo", type: BadgeType.SUBSCRIPTION, color: "#FFD700", autoAward: true },
    { slug: "platinum-member", name: "Platinum", description: "Miembro Platinum activo", type: BadgeType.SUBSCRIPTION, color: "#E5E4E2", autoAward: true },
    { slug: "diamond-member", name: "Diamond", description: "Miembro Diamond activo", type: BadgeType.SUBSCRIPTION, color: "#B9F2FF", autoAward: true },

    // Tenure badges
    { slug: "bronze-tenure", name: "Bronze", description: "3-6 meses de antigüedad", type: BadgeType.TENURE, color: "#CD7F32", autoAward: true, criteria: { months: 3 } },
    { slug: "silver-tenure", name: "Silver Veteran", description: "6-12 meses de antigüedad", type: BadgeType.TENURE, color: "#C0C0C0", autoAward: true, criteria: { months: 6 } },
    { slug: "gold-tenure", name: "Gold Veteran", description: "12-24 meses de antigüedad", type: BadgeType.TENURE, color: "#FFD700", autoAward: true, criteria: { months: 12 } },
    { slug: "boss", name: "Boss", description: "24+ meses de antigüedad", type: BadgeType.TENURE, color: "#4B0082", autoAward: true, criteria: { months: 24 } },

    // Achievement badges
    { slug: "founder", name: "Founder", description: "Miembro fundador (primeros 6 meses)", type: BadgeType.ACHIEVEMENT, color: "#8B4513", autoAward: false },

    // Role badges
    { slug: "verified-performer", name: "Verified Performer", description: "Performer verificada", type: BadgeType.ROLE, color: "#FF69B4", autoAward: false },
    { slug: "admin", name: "Admin", description: "Administrador del sitio", type: BadgeType.ROLE, color: "#FF0000", autoAward: false },
    { slug: "moderator", name: "Moderator", description: "Moderador de la comunidad", type: BadgeType.ROLE, color: "#00FF00", autoAward: false },

    // Community badges (user-selectable)
    { slug: "bull", name: "Bull", description: "Rol de comunidad: Bull", type: BadgeType.COMMUNITY, color: "#1E90FF", autoAward: false },
    { slug: "voyeur", name: "Voyeur", description: "Rol de comunidad: Voyeur", type: BadgeType.COMMUNITY, color: "#9370DB", autoAward: false },
    { slug: "cuckold", name: "Cuckold", description: "Rol de comunidad: Cuckold", type: BadgeType.COMMUNITY, color: "#20B2AA", autoAward: false },
    { slug: "stag", name: "Stag", description: "Rol de comunidad: Stag", type: BadgeType.COMMUNITY, color: "#DAA520", autoAward: false },
    { slug: "hotwife", name: "Hotwife", description: "Rol de comunidad: Hotwife", type: BadgeType.COMMUNITY, color: "#FF1493", autoAward: false },
  ]

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    })
  }

  // 3. Video Categories
  console.log("🎬 Creating video categories...")
  const videoCategories = [
    { slug: "bukkake", name: "Bukkake", description: "Videos de bukkake", order: 1 },
    { slug: "gangbang", name: "Gangbang", description: "Videos de gangbang", order: 2 },
    { slug: "blowbang", name: "Blowbang", description: "Videos de blowbang", order: 3 },
    { slug: "gokkun", name: "Gokkun", description: "Videos de gokkun", order: 4 },
    { slug: "cumshot", name: "Cumshot", description: "Videos de cumshot", order: 5 },
    { slug: "facial", name: "Facial", description: "Videos de facial", order: 6 },
    { slug: "creampie", name: "Creampie", description: "Videos de creampie", order: 7 },
    { slug: "amateur", name: "Amateur", description: "Contenido amateur", order: 8 },
    { slug: "professional", name: "Professional", description: "Contenido profesional", order: 9 },
  ]

  for (const category of videoCategories) {
    await prisma.videoCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }

  // 4. Shop Categories
  console.log("🛍️ Creating shop categories...")
  const shopCategories = [
    { slug: "ropa", name: "Ropa", description: "Camisetas, sudaderas y más", order: 1 },
    { slug: "accesorios", name: "Accesorios", description: "Gorras, llaveros y más", order: 2 },
    { slug: "coleccionables", name: "Coleccionables", description: "Artículos de colección", order: 3 },
    { slug: "fotos-firmadas", name: "Fotos Firmadas", description: "Fotos autografiadas", order: 4 },
    { slug: "juguetes", name: "Juguetes", description: "Juguetes para adultos", order: 5 },
  ]

  for (const category of shopCategories) {
    await prisma.shopCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }

  // 5. Forum Categories (now using minTierPlanId)
  console.log("💬 Creating forum categories...")
  const forumCategories = [
    { slug: "general", name: "General", description: "Discusión general", order: 1, minTierPlanId: planIdsBySlug["premium"] },
    { slug: "videos", name: "Videos", description: "Discusión sobre videos", order: 2, minTierPlanId: planIdsBySlug["gold"] },
    { slug: "performers", name: "Performers", description: "Discusión sobre performers", order: 3, minTierPlanId: planIdsBySlug["gold"] },
    { slug: "requests", name: "Peticiones", description: "Peticiones de contenido", order: 4, minTierPlanId: planIdsBySlug["gold"] },
    { slug: "vip-lounge", name: "VIP Lounge", description: "Zona exclusiva para Diamond", order: 5, minTierPlanId: planIdsBySlug["diamond"] },
  ]

  for (const category of forumCategories) {
    await prisma.forumCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }

  // 6. Admin User
  console.log("👤 Creating admin user...")
  const hashedPassword = await hash("admin123456", 12)

  await prisma.user.upsert({
    where: { email: "admin@bukkakery.com" },
    update: {
      isAdmin: true,
      isVerified: true,
      subscriptionPlanId: planIdsBySlug["diamond"],
    },
    create: {
      email: "admin@bukkakery.com",
      password: hashedPassword,
      name: "Admin",
      username: "admin",
      isAdmin: true,
      isVerified: true,
      subscriptionPlanId: planIdsBySlug["diamond"],
      emailVerified: new Date(),
    },
  })

  // 7. Sample Tags
  console.log("🏷️ Creating sample tags...")
  const tags = [
    "blonde", "brunette", "redhead", "asian", "latina", "european",
    "milf", "teen", "petite", "curvy", "tattoo", "piercing",
    "pov", "4k", "hd", "exclusive", "new", "popular",
  ]

  for (const tagName of tags) {
    await prisma.tag.upsert({
      where: { slug: tagName },
      update: {},
      create: { slug: tagName, name: tagName.charAt(0).toUpperCase() + tagName.slice(1) },
    })
  }

  // 8. Menus
  console.log("📋 Creating menus...")

  // Header menu
  const headerMenu = await prisma.menu.upsert({
    where: { slug: "header-main" },
    update: {},
    create: {
      name: "Header Principal",
      slug: "header-main",
      description: "Menú principal del header",
    },
  })

  // Only add items if menu was just created (no items exist)
  const headerItemCount = await prisma.menuItem.count({
    where: { menuId: headerMenu.id },
  })

  if (headerItemCount === 0) {
    const headerItems = [
      { label: "Vídeos", url: "/videos", order: 1 },
      { label: "Modelos", url: "/modelos", order: 2 },
      { label: "Categorías", url: "/categorias", order: 3 },
      { label: "Shop Live", url: "/tienda", order: 4 },
      { label: "Casting", url: "/casting", order: 5 },
      { label: "Blog", url: "/blog", order: 6 },
    ]

    for (const item of headerItems) {
      await prisma.menuItem.create({
        data: {
          menuId: headerMenu.id,
          label: item.label,
          url: item.url,
          order: item.order,
          isVisible: true,
        },
      })
    }
  }

  // Footer menus
  const footerMenus = [
    {
      slug: "footer-col-1",
      name: "Footer Servicios",
      description: "Columna de servicios en el footer",
      items: [
        { label: "The Bukkake Degree™", url: "#", order: 1 },
        { label: "Tienda", url: "/tienda", order: 2 },
        { label: "Blog", url: "/blog", order: 3 },
        { label: "Foro", url: "/foro", order: 4 },
      ],
    },
    {
      slug: "footer-col-2",
      name: "Footer Contacto",
      description: "Columna de contacto en el footer",
      items: [
        { label: "Contact & Support", url: "/contacto", order: 1 },
        { label: "Report Content", url: "/reportar", order: 2 },
        { label: "Login", url: "/login", order: 3 },
      ],
    },
    {
      slug: "footer-col-3",
      name: "Footer Información",
      description: "Columna de información en el footer",
      items: [
        { label: "Terms of Service", url: "/p/terminos-servicio", order: 1 },
        { label: "Privacy Policy", url: "/p/politica-privacidad", order: 2 },
        { label: "Trust and Safety", url: "/p/confianza-seguridad", order: 3 },
        { label: "Content Removal Policy", url: "/p/politica-eliminacion", order: 4 },
        { label: "Casting", url: "/casting", order: 5 },
        { label: "Webmaster", url: "/webmaster", order: 6 },
      ],
    },
    {
      slug: "footer-col-4",
      name: "Footer Facturación",
      description: "Columna de facturación en el footer",
      items: [
        { label: "Epoch", url: "#", order: 1 },
        { label: "Segpay", url: "#", order: 2 },
        { label: "Vxnbill", url: "#", order: 3 },
        { label: "Centrobill", url: "#", order: 4 },
      ],
    },
    {
      slug: "footer-social",
      name: "Footer Redes Sociales",
      description: "Redes sociales en el footer",
      items: [
        { label: "Instagram", url: "https://instagram.com", icon: "instagram", order: 1 },
        { label: "X", url: "https://x.com", icon: "x", order: 2 },
        { label: "TikTok", url: "https://tiktok.com", icon: "tiktok", order: 3 },
      ],
    },
  ]

  for (const menuData of footerMenus) {
    const menu = await prisma.menu.upsert({
      where: { slug: menuData.slug },
      update: {},
      create: {
        name: menuData.name,
        slug: menuData.slug,
        description: menuData.description,
      },
    })

    // Only add items if menu was just created (no items exist)
    const itemCount = await prisma.menuItem.count({
      where: { menuId: menu.id },
    })

    if (itemCount === 0) {
      for (const item of menuData.items) {
        await prisma.menuItem.create({
          data: {
            menuId: menu.id,
            label: item.label,
            url: item.url,
            icon: "icon" in item ? item.icon : null,
            order: item.order,
            isVisible: true,
            openInNewTab: item.url.startsWith("http"),
          },
        })
      }
    }
  }

  // 9. Home Sections
  console.log("🏠 Creating home sections...")

  const homeSections = [
    {
      type: HomeSectionType.HERO,
      title: null,
      order: 1,
      config: {
        backgroundImage: "/images/background.png",
        videoId: null,
        linkUrl: null,
      },
    },
    {
      type: HomeSectionType.VIDEO_GRID,
      title: "Los más vistos de la semana",
      order: 2,
      config: {
        source: "popular",
        limit: 6,
        columns: 3,
      },
    },
    {
      type: HomeSectionType.VIDEO_GRID,
      title: "Tendencias",
      order: 3,
      config: {
        source: "latest",
        limit: 6,
        columns: 3,
      },
    },
    {
      type: HomeSectionType.ACTRESS_GRID,
      title: "Las chicas de la semana",
      order: 4,
      config: {
        source: "featured",
        limit: 10,
      },
    },
    {
      type: HomeSectionType.VIDEO_GRID,
      title: "Bukkakes amateur",
      order: 5,
      config: {
        source: "category",
        categorySlug: "amateur",
        limit: 6,
        columns: 3,
      },
    },
    {
      type: HomeSectionType.CTA_BANNER,
      title: null,
      order: 6,
      config: {
        title: "BUKKAKE PARTIES",
        description: "Apúntate a los bukkakes más salvajes del país.",
        buttonText: "Ver Eventos",
        buttonUrl: "/eventos",
        backgroundImage: "/images/cta-background.jpg",
      },
    },
    {
      type: HomeSectionType.VIDEO_GRID,
      title: "Bukkakes profesionales",
      order: 7,
      config: {
        source: "category",
        categorySlug: "professional",
        limit: 6,
        columns: 3,
      },
    },
    {
      type: HomeSectionType.VIDEO_GRID,
      title: "Gangbangs",
      order: 8,
      config: {
        source: "category",
        categorySlug: "gangbang",
        limit: 6,
        columns: 3,
      },
    },
    {
      type: HomeSectionType.COUNTDOWN,
      title: null,
      order: 9,
      config: {
        targetDate: "2025-10-24",
        title: "PRÓXIMO EVENTO",
        subtitle: "Bukkake Party Barcelona",
        backgroundImage: "/images/countdown-bg.jpg",
      },
    },
  ]

  // Check if home sections exist
  const existingSections = await prisma.homeSection.count()

  if (existingSections === 0) {
    for (const section of homeSections) {
      await prisma.homeSection.create({
        data: section,
      })
    }
  }

  console.log("✅ Seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
