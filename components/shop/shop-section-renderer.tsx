import { ShopSectionType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ShopHero } from "./shop-hero"
import { ShopTrustIcons } from "./shop-trust-icons"
import { ShopFeaturedCollections } from "./shop-featured-collections"
import { ShopReviews } from "./shop-reviews"
import { ShopFaq } from "./shop-faq"
import { ProductCard } from "./product-card"
import { CmsContent } from "@/components/cms-content"
import Link from "next/link"
import Image from "next/image"

interface ShopSection {
  id: string
  type: ShopSectionType
  title: string | null
  enabled: boolean
  order: number
  config: Record<string, unknown> | null
}

interface ShopSectionRendererProps {
  section: ShopSection
}

export async function ShopSectionRenderer({ section }: ShopSectionRendererProps) {
  if (!section.enabled) return null
  const config = section.config || {}

  switch (section.type) {
    case "HERO": {
      return (
        <ShopHeroSection config={config} title={section.title} />
      )
    }

    case "TRUST_ICONS": {
      const items = (config.items as Array<{ icon: string; label: string }>) || []
      return (
        <ShopTrustIcons enabled={true} items={items} />
      )
    }

    case "FEATURED_COLLECTIONS": {
      const categoryIds = (config.categoryIds as string[]) || []
      let categories: Array<{ id: string; name: string; slug: string; imageUrl: string | null; description: string | null }> = []

      if (categoryIds.length > 0) {
        categories = await prisma.shopCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, slug: true, imageUrl: true, description: true },
        })
      } else {
        categories = await prisma.shopCategory.findMany({
          where: { parentId: null, imageUrl: { not: null } },
          orderBy: { order: "asc" },
          take: 4,
          select: { id: true, name: true, slug: true, imageUrl: true, description: true },
        })
      }

      return (
        <ShopFeaturedCollections
          enabled={true}
          title={section.title || (config.subtitle ? String(section.title) : "Featured Collections")}
          subtitle={(config.subtitle as string) || ""}
          categories={categories}
        />
      )
    }

    case "PRODUCTS_GRID": {
      return <ProductsGridSection config={config} title={section.title} />
    }

    case "REVIEWS": {
      const items = (config.items as Array<{ name: string; rating: number; text: string }>) || []
      return (
        <ShopReviews
          enabled={true}
          title={section.title || "What Our Customers Say"}
          items={items}
        />
      )
    }

    case "FAQ": {
      const items = (config.items as Array<{ question: string; answer: string }>) || []
      return (
        <ShopFaq
          enabled={true}
          title={section.title || "Frequently Asked Questions"}
          items={items}
          bgColor={(config.bgColor as string) || undefined}
          titleColor={(config.titleColor as string) || undefined}
        />
      )
    }

    case "CTA_BANNER": {
      return <CtaBannerSection config={config} />
    }

    case "VIDEO_GRID": {
      return <VideoGridSection config={config} title={section.title} />
    }

    case "MODEL_PICKS": {
      return <ModelPicksSection config={config} title={section.title} />
    }

    case "PRODUCT_VIDEOS": {
      return <ProductVideosSection config={config} title={section.title} />
    }

    case "PAGE": {
      const pageId = config.pageId as string
      if (!pageId) return null
      const page = await prisma.page.findUnique({
        where: { id: pageId, status: "PUBLISHED" },
        select: { title: true, content: true },
      })
      if (!page) return null
      return (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            {section.title && (
              <h2
                className="text-3xl md:text-4xl font-bold mb-8"
                style={{ color: "var(--text-primary, #000)" }}
              >
                {section.title}
              </h2>
            )}
            <CmsContent content={page.content} />
          </div>
        </section>
      )
    }

    default:
      return null
  }
}

// HERO with video/image support
function ShopHeroSection({ config, title }: { config: Record<string, unknown>; title: string | null }) {
  const videoUrl = config.videoUrl as string | undefined
  const backgroundImage = config.backgroundImage as string | undefined
  const badgeText = (config.badgeText as string) || ""
  const heroTitle = (config.title as string) || title || "Discover Our Shop"
  const subtitle = (config.subtitle as string) || ""
  const ctaPrimaryText = (config.ctaPrimaryText as string) || ""
  const ctaPrimaryUrl = (config.ctaPrimaryUrl as string) || "/shop#productos"
  const ctaSecondaryText = (config.ctaSecondaryText as string) || ""
  const ctaSecondaryUrl = (config.ctaSecondaryUrl as string) || ""
  const linkUrl = config.linkUrl as string | undefined

  const content = (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "500px" }}>
      {/* Video background */}
      {videoUrl ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, var(--brand-color, #E03E54) 0%, #000 100%)` }}
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 flex items-center min-h-[500px]">
        <div className="max-w-2xl">
          {badgeText && (
            <span
              className="inline-block text-xs font-bold px-4 py-1.5 mb-6 tracking-wider text-white"
              style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
            >
              {badgeText}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {heroTitle}
          </h1>
          {subtitle && (
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">{subtitle}</p>
          )}
          {(ctaPrimaryText || ctaSecondaryText) && (
            <div className="flex flex-wrap gap-4">
              {ctaPrimaryText && (
                <Link
                  href={ctaPrimaryUrl}
                  className="inline-flex items-center px-8 py-4 text-white font-bold text-lg transition-all hover:opacity-90 hover:scale-105"
                  style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
                >
                  {ctaPrimaryText}
                </Link>
              )}
              {ctaSecondaryText && (
                <Link
                  href={ctaSecondaryUrl}
                  className="inline-flex items-center px-8 py-4 text-white font-bold text-lg border-2 border-white/30 transition-all hover:bg-white/10 hover:scale-105"
                >
                  {ctaSecondaryText}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )

  if (linkUrl) {
    return <Link href={linkUrl}>{content}</Link>
  }
  return content
}

// Products Grid with real data
async function ProductsGridSection({ config, title }: { config: Record<string, unknown>; title: string | null }) {
  const sort = (config.sort as string) || "newest"
  const limit = (config.limit as number) || 8
  const columns = (config.columns as number) || 4
  const showPagination = (config.showPagination as boolean) ?? true

  let orderBy: Record<string, string> = { createdAt: "desc" }
  switch (sort) {
    case "price_asc": orderBy = { price: "asc" }; break
    case "price_desc": orderBy = { price: "desc" }; break
    default: orderBy = { createdAt: "desc" }
  }

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: limit,
    orderBy,
    include: {
      performers: {
        include: {
          performer: { select: { name: true, slug: true } },
        },
      },
      variants: {
        where: { isActive: true },
        select: { stock: true },
      },
    },
  })

  const colsClass = columns === 2
    ? "grid-cols-1 md:grid-cols-2"
    : columns === 3
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"

  return (
    <section className="py-16" id="productos">
      <div className="max-w-7xl mx-auto px-6">
        {title && (
          <div className="mb-8">
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: "var(--text-primary, #000)" }}
            >
              {title}
            </h2>
          </div>
        )}
        {products.length > 0 ? (
          <div className={`grid ${colsClass} gap-8`}>
            {products.map((product) => {
              const effectiveStock = product.productType === "VARIABLE"
                ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                : product.stock

              return (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: Number(product.price),
                    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
                    images: product.images,
                    stock: effectiveStock,
                    trackInventory: product.trackInventory,
                    productType: product.productType,
                    performers: product.performers.map((pp) => pp.performer),
                    createdAt: product.createdAt?.toISOString(),
                  }}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p style={{ color: "var(--text-muted)" }}>No products available</p>
          </div>
        )}

        {showPagination && (
          <div className="text-center mt-12">
            <Link
              href="/shop?page=1"
              className="inline-flex items-center px-8 py-3 font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
            >
              View All Products
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

// CTA Banner
function CtaBannerSection({ config }: { config: Record<string, unknown> }) {
  const videoUrl = config.videoUrl as string | undefined
  const backgroundImage = config.backgroundImage as string | undefined
  const bannerTitle = (config.bannerTitle as string) || ""
  const description = (config.bannerDescription as string) || ""
  const buttonText = (config.buttonText as string) || ""
  const buttonUrl = (config.buttonUrl as string) || "#"

  return (
    <section className="relative overflow-hidden py-20" style={{ minHeight: "300px" }}>
      {videoUrl ? (
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : backgroundImage ? (
        <div className="absolute inset-0">
          <Image src={backgroundImage} alt="" fill className="object-cover" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-black" />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        {bannerTitle && (
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{bannerTitle}</h2>
        )}
        {description && (
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">{description}</p>
        )}
        {buttonText && (
          <Link
            href={buttonUrl}
            className="inline-flex items-center px-8 py-4 font-bold text-white text-lg transition-all hover:opacity-90 hover:scale-105"
            style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
          >
            {buttonText}
          </Link>
        )}
      </div>
    </section>
  )
}

// Video Grid - simplified version
async function VideoGridSection({ config, title }: { config: Record<string, unknown>; title: string | null }) {
  const limit = (config.limit as number) || 4

  const videos = await prisma.video.findMany({
    where: { status: "PUBLISHED" },
    take: limit,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnailUrl: true,
    },
  })

  if (videos.length === 0) return null

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        {title && (
          <h2
            className="text-2xl md:text-3xl font-bold mb-8"
            style={{ color: "var(--text-primary, #000)" }}
          >
            {title}
          </h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {videos.map((video) => (
            <Link key={video.id} href={`/videos/${video.slug}`} className="group">
              <div className="relative aspect-video overflow-hidden mb-3" style={{ backgroundColor: "var(--surface-bg, #f3f4f6)" }}>
                {video.thumbnailUrl && (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="250px"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/90 flex items-center justify-center">
                    <div className="w-0 h-0 ml-1" style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: "14px solid var(--brand-color, #E03E54)" }} />
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium line-clamp-1" style={{ color: "var(--text-primary, #000)" }}>
                {video.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Model Picks — performers recommending products (fetches from DB)
async function ModelPicksSection({ config, title }: { config: Record<string, unknown>; title: string | null }) {
  const subtitle = (config.subtitle as string) || ""
  const items = (config.items as Array<{
    performerId: string
    productId: string
    badge: string
    quote: string
    rating: number
  }>) || []

  if (items.length === 0) return null

  // Fetch all referenced performers and products in bulk
  const performerIds = items.map(i => i.performerId).filter(Boolean)
  const productIds = items.map(i => i.productId).filter(Boolean)

  const [performersData, productsData] = await Promise.all([
    performerIds.length > 0
      ? prisma.performer.findMany({
          where: { id: { in: performerIds } },
          select: { id: true, name: true, slug: true, profileImage: true },
        })
      : [],
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true, images: true, price: true },
        })
      : [],
  ])

  const performerMap = new Map(performersData.map(p => [p.id, p]))
  const productMap = new Map(productsData.map(p => [p.id, p]))

  // Filter out items with missing performer or product
  const validItems = items.filter(item => performerMap.has(item.performerId) && productMap.has(item.productId))
  if (validItems.length === 0) return null

  return (
    <section className="py-20" style={{ backgroundColor: "var(--surface-bg, #f9fafb)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary, #000)" }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg" style={{ color: "var(--text-muted, #6b7280)" }}>{subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {validItems.map((item, i) => {
            const performer = performerMap.get(item.performerId)!
            const product = productMap.get(item.productId)!
            const productImage = product.images[0] || ""
            const productPrice = Number(product.price)

            return (
              <div
                key={i}
                className="p-8 border shadow-lg hover:shadow-xl transition-shadow"
                style={{ backgroundColor: "var(--card-bg, #fff)", borderColor: "var(--border-color, #e5e7eb)" }}
              >
                <div className="flex gap-6 mb-6">
                  {performer.profileImage && (
                    <Image
                      src={performer.profileImage}
                      alt={performer.name}
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover ring-4"
                      style={{ "--tw-ring-color": "var(--brand-color, #E03E54)" } as React.CSSProperties}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold" style={{ color: "var(--text-primary, #000)" }}>
                        {performer.name}
                      </h3>
                      {item.badge && (
                        <span
                          className="text-xs px-3 py-1 font-bold text-white"
                          style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.quote && (
                      <p className="italic mb-4" style={{ color: "var(--text-muted, #6b7280)" }}>
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(item.rating || 5)].map((_, j) => (
                          <svg key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm" style={{ color: "var(--text-muted, #6b7280)" }}>
                        {item.rating || 5}.0
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  {productImage && (
                    <Image
                      src={productImage}
                      alt={product.name}
                      width={128}
                      height={128}
                      className="w-32 h-32 object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary, #000)" }}>
                      {product.name}
                    </h4>
                    <p className="font-bold text-2xl mb-3" style={{ color: "var(--brand-color, #E03E54)" }}>
                      {productPrice.toFixed(2)}&euro;
                    </p>
                    <Link
                      href={`/tienda/${product.slug}`}
                      className="inline-flex items-center justify-center w-full px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
                    >
                      Shop Her Pick
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Product Videos — pinned videos first, then fill with latest
async function ProductVideosSection({ config, title }: { config: Record<string, unknown>; title: string | null }) {
  const subtitle = (config.subtitle as string) || ""
  const limit = (config.limit as number) || 4
  const pinnedIds = (config.pinnedVideoIds as string[]) || []

  const videoSelect = {
    id: true,
    slug: true,
    title: true,
    thumbnailUrl: true,
    performers: {
      include: { performer: { select: { name: true } } },
      take: 1,
    },
  } as const

  // Fetch pinned videos first
  let pinned: Array<{ id: string; slug: string; title: string; thumbnailUrl: string | null; performers: Array<{ performer: { name: string } }> }> = []
  if (pinnedIds.length > 0) {
    pinned = await prisma.video.findMany({
      where: { id: { in: pinnedIds }, status: "PUBLISHED" },
      select: videoSelect,
    })
    // Preserve pin order
    pinned = pinnedIds
      .map(id => pinned.find(v => v.id === id))
      .filter((v): v is NonNullable<typeof v> => v != null)
  }

  // Fill remaining slots with latest (excluding pinned)
  const remaining = limit - pinned.length
  let latest: typeof pinned = []
  if (remaining > 0) {
    latest = await prisma.video.findMany({
      where: {
        status: "PUBLISHED",
        ...(pinnedIds.length > 0 ? { id: { notIn: pinnedIds } } : {}),
      },
      take: remaining,
      orderBy: { publishedAt: "desc" },
      select: videoSelect,
    })
  }

  const videos = [...pinned, ...latest]
  if (videos.length === 0) return null

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary, #000)" }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg" style={{ color: "var(--text-muted, #6b7280)" }}>{subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <Link key={video.id} href={`/videos/${video.slug}`} className="group">
              <div className="relative overflow-hidden mb-4">
                <div className="aspect-video" style={{ backgroundColor: "var(--surface-bg, #f3f4f6)" }}>
                  {video.thumbnailUrl && (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="300px"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 group-hover:bg-[var(--brand-color,#E03E54)] w-16 h-16 flex items-center justify-center transition-colors">
                    <div className="w-0 h-0 ml-1" style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: "14px solid var(--brand-color, #E03E54)" }} />
                  </div>
                </div>
                <div
                  className="absolute top-3 left-3 text-white text-xs px-3 py-1.5 font-bold"
                  style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
                >
                  Featured Product
                </div>
              </div>
              <div className="px-2">
                <p className="font-bold mb-1" style={{ color: "var(--text-primary, #000)" }}>
                  {video.performers[0]?.performer.name || video.title}
                </p>
                <p className="text-sm mb-2" style={{ color: "var(--text-muted, #6b7280)" }}>
                  {video.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
