import { PrismaClient, BadgeType, HomeSectionType, ShopSectionType } from "@prisma/client"
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
    { slug: "lingerie", name: "Lingerie", description: "Sexy and elegant lingerie", order: 1, imageUrl: "https://images.unsplash.com/photo-1763906471843-aa53dad9fba8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
    { slug: "toys", name: "Toys", description: "Premium adult toys collection", order: 2, imageUrl: "https://images.unsplash.com/photo-1605125207352-e8512d068ed7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
    { slug: "personalised", name: "Personalised", description: "Custom and personalized items", order: 3, imageUrl: "https://images.unsplash.com/photo-1771660722417-38ceb9e85bc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
    { slug: "dresses", name: "Dresses", description: "Elegant and stylish dresses", order: 4, imageUrl: "https://images.unsplash.com/photo-1761574028262-6d834741bfd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
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
      adminRole: "GLOBAL_ADMIN",
      isVerified: true,
      subscriptionPlanId: planIdsBySlug["diamond"],
    },
    create: {
      email: "admin@bukkakery.com",
      password: hashedPassword,
      name: "Admin",
      username: "admin",
      isAdmin: true,
      adminRole: "GLOBAL_ADMIN",
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

  // 7b. Sample Performers
  console.log("💃 Creating sample performers...")

  const anaPaula = await prisma.performer.upsert({
    where: { slug: "ana-paula" },
    update: {},
    create: {
      slug: "ana-paula",
      name: "Ana Paula",
      bio: "Top performer and brand ambassador.",
      profileImage: "https://images.unsplash.com/photo-1618908623278-dfcf55e6f687?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      verified: true,
    },
  })

  const sofiaRose = await prisma.performer.upsert({
    where: { slug: "sofia-rose" },
    update: {},
    create: {
      slug: "sofia-rose",
      name: "Sofia Rose",
      bio: "Featured creator and style icon.",
      profileImage: "https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      verified: true,
    },
  })

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

  // 10. Shop Sections
  console.log("🛍️ Creating shop sections...")

  const shopSections = [
    {
      type: ShopSectionType.HERO,
      title: "Hero",
      order: 0,
      config: {
        backgroundImage: "https://images.unsplash.com/photo-1560660019-7625c7e27d91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        badgeText: "NEW COLLECTION JUST DROPPED",
        title: "Official Bukkakery Gear",
        subtitle: "Exclusive merchandise designed for our community. Premium quality, limited quantities.",
        ctaPrimaryText: "Shop Now",
        ctaPrimaryUrl: "/tienda#productos",
        ctaSecondaryText: "Explore Collections",
        ctaSecondaryUrl: "/tienda#colecciones",
      },
    },
    {
      type: ShopSectionType.TRUST_ICONS,
      title: "Trust Icons",
      order: 1,
      config: {
        items: [
          { icon: "Package", label: "Discreet Shipping" },
          { icon: "Shield", label: "5 Year Warranty" },
          { icon: "Lock", label: "Secure Payment" },
          { icon: "RotateCcw", label: "30 Day Returns" },
        ],
      },
    },
    {
      type: ShopSectionType.FEATURED_COLLECTIONS,
      title: "Featured Collections",
      order: 2,
      config: {
        subtitle: "Explore our curated product categories",
        categoryIds: [],
      },
    },
    {
      type: ShopSectionType.PRODUCTS_GRID,
      title: "Featured Products",
      order: 3,
      config: {
        sort: "newest",
        limit: 8,
        columns: 4,
        showPagination: true,
      },
    },
    {
      type: ShopSectionType.MODEL_PICKS,
      title: "Models Recommend",
      order: 4,
      config: {
        subtitle: "See what our top performers are loving",
        items: [],
      },
    },
    {
      type: ShopSectionType.PRODUCT_VIDEOS,
      title: "See Them in Action",
      order: 5,
      config: {
        subtitle: "Watch our products featured in exclusive content",
        limit: 4,
      },
    },
    {
      type: ShopSectionType.REVIEWS,
      title: "What Our Customers Say",
      order: 6,
      config: {
        items: [
          { name: "Michael R.", rating: 5, text: "Amazing quality and fast shipping! The products exceeded my expectations. The discreet packaging was a nice touch." },
          { name: "Sarah K.", rating: 5, text: "Love the exclusive designs! Finally merchandise that matches the quality of the content. Will definitely order again." },
          { name: "James L.", rating: 5, text: "Best adult brand merchandise out there. Premium materials and perfect fit. Customer service was excellent too!" },
        ],
      },
    },
    {
      type: ShopSectionType.FAQ,
      title: "Frequently Asked Questions",
      order: 7,
      config: {
        items: [
          { question: "What are the shipping times?", answer: "We offer express shipping with delivery in 3-5 business days for most locations." },
          { question: "Is the packaging discreet?", answer: "Yes! All orders are shipped in plain, unmarked packaging for complete privacy." },
          { question: "What is your return policy?", answer: "We accept returns within 30 days of purchase. Items must be unused and in original packaging." },
          { question: "What payment methods do you accept?", answer: "We accept all major credit cards, PayPal, and cryptocurrency for maximum convenience." },
        ],
      },
    },
  ]

  const existingShopSections = await prisma.shopSection.count()
  if (existingShopSections === 0) {
    for (const section of shopSections) {
      await prisma.shopSection.create({ data: section })
    }
  }

  // 11. Attributes for Products
  console.log("🎨 Creating product attributes...")

  const attributesData = [
    {
      slug: "talla",
      name: "Talla",
      type: "SELECT" as const,
      order: 1,
      values: [
        { slug: "xs", value: "XS", order: 1 },
        { slug: "s", value: "S", order: 2 },
        { slug: "m", value: "M", order: 3 },
        { slug: "l", value: "L", order: 4 },
        { slug: "xl", value: "XL", order: 5 },
        { slug: "xxl", value: "XXL", order: 6 },
      ],
    },
    {
      slug: "color",
      name: "Color",
      type: "COLOR" as const,
      order: 2,
      values: [
        { slug: "negro", value: "Negro", colorHex: "#000000", order: 1 },
        { slug: "blanco", value: "Blanco", colorHex: "#FFFFFF", order: 2 },
        { slug: "rojo", value: "Rojo", colorHex: "#FF0000", order: 3 },
        { slug: "azul", value: "Azul", colorHex: "#0000FF", order: 4 },
        { slug: "rosa", value: "Rosa", colorHex: "#FF69B4", order: 5 },
      ],
    },
    {
      slug: "material",
      name: "Material",
      type: "SELECT" as const,
      order: 3,
      values: [
        { slug: "algodon", value: "Algodón 100%", order: 1 },
        { slug: "poliester", value: "Poliéster", order: 2 },
        { slug: "mixto", value: "Mixto (50/50)", order: 3 },
      ],
    },
  ]

  const attributeIdsBySlug: Record<string, string> = {}
  const valueIdsBySlug: Record<string, string> = {}

  for (const attr of attributesData) {
    const createdAttr = await prisma.attribute.upsert({
      where: { slug: attr.slug },
      update: { name: attr.name, type: attr.type, order: attr.order },
      create: { slug: attr.slug, name: attr.name, type: attr.type, order: attr.order },
    })
    attributeIdsBySlug[attr.slug] = createdAttr.id

    for (const val of attr.values) {
      const createdVal = await prisma.attributeValue.upsert({
        where: { attributeId_slug: { attributeId: createdAttr.id, slug: val.slug } },
        update: { value: val.value, colorHex: "colorHex" in val ? val.colorHex : null, order: val.order },
        create: {
          attributeId: createdAttr.id,
          slug: val.slug,
          value: val.value,
          colorHex: "colorHex" in val ? val.colorHex : null,
          order: val.order,
        },
      })
      valueIdsBySlug[`${attr.slug}-${val.slug}`] = createdVal.id
    }
  }

  // 11. Sample Product with Variants
  console.log("👕 Creating sample product with variants...")

  const ropaCategory = await prisma.shopCategory.findUnique({ where: { slug: "ropa" } })

  // Create a variable product
  const camiseta = await prisma.product.upsert({
    where: { slug: "camiseta-bukkakery-classic" },
    update: {},
    create: {
      slug: "camiseta-bukkakery-classic",
      name: "Camiseta Bukkakery Classic",
      description: "La camiseta oficial de Bukkakery. 100% algodón, corte clásico.\n\nDisponible en múltiples tallas y colores.",
      productType: "VARIABLE",
      price: 29.99,
      compareAtPrice: 39.99,
      sku: "CAM-CLASSIC",
      stock: 0, // Variable products use variant stock
      trackInventory: true,
      images: ["/images/placeholder-product.jpg"],
      status: "ACTIVE",
    },
  })

  // Add product to category
  if (ropaCategory) {
    await prisma.productToCategory.upsert({
      where: { productId_categoryId: { productId: camiseta.id, categoryId: ropaCategory.id } },
      update: {},
      create: { productId: camiseta.id, categoryId: ropaCategory.id },
    })
  }

  // Associate attributes with product
  await prisma.productAttribute.upsert({
    where: { productId_attributeId: { productId: camiseta.id, attributeId: attributeIdsBySlug["talla"] } },
    update: {},
    create: { productId: camiseta.id, attributeId: attributeIdsBySlug["talla"], order: 1 },
  })

  await prisma.productAttribute.upsert({
    where: { productId_attributeId: { productId: camiseta.id, attributeId: attributeIdsBySlug["color"] } },
    update: {},
    create: { productId: camiseta.id, attributeId: attributeIdsBySlug["color"], order: 2 },
  })

  // Create some variants (not all combinations, just a few for testing)
  const variantsData = [
    { talla: "s", color: "negro", price: 29.99, stock: 10 },
    { talla: "m", color: "negro", price: 29.99, stock: 15 },
    { talla: "l", color: "negro", price: 29.99, stock: 12 },
    { talla: "s", color: "blanco", price: 29.99, stock: 8 },
    { talla: "m", color: "blanco", price: 29.99, stock: 20 },
    { talla: "l", color: "blanco", price: 29.99, stock: 10 },
    { talla: "m", color: "rojo", price: 32.99, stock: 5 },
    { talla: "l", color: "rojo", price: 32.99, stock: 3 },
    { talla: "xl", color: "negro", price: 34.99, stock: 6 },
    { talla: "xl", color: "blanco", price: 34.99, stock: 4 },
  ]

  for (const v of variantsData) {
    const sku = `CAM-${v.talla.toUpperCase()}-${v.color.toUpperCase()}`

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({ where: { sku } })

    if (!existingVariant) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: camiseta.id,
          sku,
          price: v.price,
          stock: v.stock,
          isActive: true,
        },
      })

      // Link attribute values
      await prisma.variantAttributeValue.create({
        data: {
          variantId: variant.id,
          attributeValueId: valueIdsBySlug[`talla-${v.talla}`],
        },
      })

      await prisma.variantAttributeValue.create({
        data: {
          variantId: variant.id,
          attributeValueId: valueIdsBySlug[`color-${v.color}`],
        },
      })
    }
  }

  // 12. Shipping Zones and Rates
  console.log("🚚 Creating shipping zones and rates...")

  // Shipping Settings
  await prisma.shippingSettings.upsert({
    where: { id: "default-settings" },
    update: {},
    create: {
      id: "default-settings",
      freeShippingEnabled: true,
      freeShippingThreshold: 50,
      defaultWeight: 0.5,
      enableWeightCalculation: false,
    },
  })

  // Spain Zone
  const spainZone = await prisma.shippingZone.upsert({
    where: { id: "zone-spain" },
    update: {},
    create: {
      id: "zone-spain",
      name: "España Peninsular",
      countries: ["ES"],
      postalCodes: [], // All of Spain
      isActive: true,
      order: 1,
    },
  })

  // Spain Rates
  await prisma.shippingRate.upsert({
    where: { id: "rate-spain-standard" },
    update: {},
    create: {
      id: "rate-spain-standard",
      zoneId: spainZone.id,
      name: "Envío Estándar",
      description: "Entrega en 3-5 días laborables",
      price: 4.99,
      freeShippingAmount: 50,
      estimatedDays: 5,
      isActive: true,
      order: 1,
    },
  })

  await prisma.shippingRate.upsert({
    where: { id: "rate-spain-express" },
    update: {},
    create: {
      id: "rate-spain-express",
      zoneId: spainZone.id,
      name: "Envío Express",
      description: "Entrega en 24-48 horas",
      price: 9.99,
      estimatedDays: 2,
      isActive: true,
      order: 2,
    },
  })

  // Madrid Zone (more specific)
  const madridZone = await prisma.shippingZone.upsert({
    where: { id: "zone-madrid" },
    update: {},
    create: {
      id: "zone-madrid",
      name: "Madrid Capital",
      countries: [],
      postalCodes: ["28*"], // All Madrid postal codes
      isActive: true,
      order: 0, // Higher priority than Spain
    },
  })

  await prisma.shippingRate.upsert({
    where: { id: "rate-madrid-sameday" },
    update: {},
    create: {
      id: "rate-madrid-sameday",
      zoneId: madridZone.id,
      name: "Envío Mismo Día",
      description: "Recíbelo hoy (pedidos antes de las 14h)",
      price: 7.99,
      estimatedDays: 0,
      isActive: true,
      order: 1,
    },
  })

  await prisma.shippingRate.upsert({
    where: { id: "rate-madrid-standard" },
    update: {},
    create: {
      id: "rate-madrid-standard",
      zoneId: madridZone.id,
      name: "Envío Estándar",
      description: "Entrega en 1-2 días laborables",
      price: 3.99,
      freeShippingAmount: 40,
      estimatedDays: 2,
      isActive: true,
      order: 2,
    },
  })

  // Europe Zone
  const europeZone = await prisma.shippingZone.upsert({
    where: { id: "zone-europe" },
    update: {},
    create: {
      id: "zone-europe",
      name: "Europa",
      countries: ["PT", "FR", "DE", "IT", "UK", "NL", "BE"],
      postalCodes: [],
      isActive: true,
      order: 2,
    },
  })

  await prisma.shippingRate.upsert({
    where: { id: "rate-europe-standard" },
    update: {},
    create: {
      id: "rate-europe-standard",
      zoneId: europeZone.id,
      name: "Envío Internacional",
      description: "Entrega en 5-10 días laborables",
      price: 14.99,
      freeShippingAmount: 100,
      estimatedDays: 10,
      isActive: true,
      order: 1,
    },
  })

  // Update shipping settings with fallback zone
  await prisma.shippingSettings.update({
    where: { id: "default-settings" },
    data: { fallbackZoneId: spainZone.id },
  })

  // 13. Email Settings
  console.log("📧 Creating email settings...")

  const emailSettings = {
    fromName: "BUKKAKERY",
    fromEmail: "noreply@bukkakery.com",
    replyTo: "soporte@bukkakery.com",
    logoUrl: null,
    primaryColor: "#FA4860",
    templates: {
      "auth/verify-email": { subject: "Verifica tu email", enabled: true },
      "auth/welcome": { subject: "Bienvenido a BUKKAKERY", enabled: true },
      "auth/reset-password": { subject: "Recupera tu contraseña", enabled: true },
      "auth/password-changed": { subject: "Tu contraseña ha sido cambiada", enabled: true },
      "orders/confirmation": { subject: "Confirmación de pedido #{orderNumber}", enabled: true },
      "orders/payment-received": { subject: "Pago recibido - Pedido #{orderNumber}", enabled: true },
      "orders/processing": { subject: "Tu pedido está siendo procesado", enabled: true },
      "orders/shipped": { subject: "Tu pedido ha sido enviado", enabled: true },
      "orders/delivered": { subject: "Tu pedido ha sido entregado", enabled: true },
      "orders/cancelled": { subject: "Pedido cancelado", enabled: true },
      "orders/payment-failed": { subject: "Problema con tu pago", enabled: true },
      "subscriptions/activated": { subject: "Tu suscripción está activa", enabled: true },
      "subscriptions/renewal-reminder": { subject: "Tu suscripción expira pronto", enabled: true },
      "subscriptions/renewed": { subject: "Suscripción renovada", enabled: true },
      "subscriptions/cancelled": { subject: "Suscripción cancelada", enabled: true },
      "subscriptions/expired": { subject: "Tu suscripción ha expirado", enabled: true },
      "subscriptions/upgrade": { subject: "Upgrade confirmado", enabled: true },
      "subscriptions/downgrade": { subject: "Cambio de plan confirmado", enabled: true },
      "subscriptions/payment-failed": { subject: "Problema con el pago de tu suscripción", enabled: true },
      "casting/received": { subject: "Hemos recibido tu solicitud", enabled: true },
      "casting/reviewing": { subject: "Tu solicitud está en revisión", enabled: true },
      "casting/accepted": { subject: "Tu solicitud ha sido aceptada", enabled: true },
      "casting/rejected": { subject: "Actualización de tu solicitud", enabled: true },
    },
  }

  await prisma.siteSettings.upsert({
    where: { key: "email_settings" },
    update: { value: emailSettings },
    create: { key: "email_settings", value: emailSettings },
  })

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
