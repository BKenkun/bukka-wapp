import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/shop/product-card"
import { getShopSettings } from "@/lib/get-shop-settings"

interface SearchParams {
  page?: string
  sort?: string
}

interface ShopCategory {
  id: string
  slug: string
  name: string
  imageUrl: string | null
}

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 12
  const skip = (page - 1) * pageSize

  // Sort option
  const sortOption = params.sort || "newest"
  let orderBy: Record<string, string> = { createdAt: "desc" }

  switch (sortOption) {
    case "popular":
      orderBy = { createdAt: "desc" }
      break
    case "price_asc":
      orderBy = { price: "asc" }
      break
    case "price_desc":
      orderBy = { price: "desc" }
      break
    case "newest":
    default:
      orderBy = { createdAt: "desc" }
  }

  // Fetch products, categories and settings
  const [productsRaw, totalCount, categories, shopSettings] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      skip,
      take: pageSize,
      orderBy,
      include: {
        performers: {
          include: {
            performer: {
              select: { name: true, slug: true },
            },
          },
        },
        variants: {
          where: { isActive: true },
          select: { stock: true },
        },
      },
    }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.shopCategory.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true, imageUrl: true },
    }),
    getShopSettings(),
  ])

  // Transform products
  const products = productsRaw.map((p) => {
    const effectiveStock = p.productType === "VARIABLE"
      ? p.variants.reduce((sum, v) => sum + v.stock, 0)
      : p.stock

    return {
      ...p,
      stock: effectiveStock,
    }
  })

  const totalPages = Math.ceil(totalCount / pageSize)

  const buildUrl = (newPage: number) => {
    const urlParams = new URLSearchParams()
    urlParams.set("page", newPage.toString())
    if (sortOption !== "newest") urlParams.set("sort", sortOption)
    return `/tienda?${urlParams.toString()}`
  }

  const buildSortUrl = (sort: string) => {
    const urlParams = new URLSearchParams()
    urlParams.set("sort", sort)
    urlParams.set("page", "1")
    return `/tienda?${urlParams.toString()}`
  }

  return (
    <main className="flex-1 flex flex-col">
      <div className="w-full mx-auto px-4 md:px-6 pt-6">
        {/* 1. Banner/Slider */}
        {shopSettings.banner.imageUrl && (
          <div className="relative w-full aspect-[21/9] mb-8 overflow-hidden">
            <Image
              src={shopSettings.banner.imageUrl}
              alt={shopSettings.banner.alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        )}

        {/* 2. Title + Description */}
        <div className="text-center mb-8">
          <h1 className="font-bold text-3xl md:text-4xl mb-3" style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}>
            Tienda
          </h1>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)" }}>
            Descubre nuestra colección exclusiva de productos
          </p>
        </div>

        {/* 3. Category Cards with Images (centered) */}
        {categories.some(c => c.imageUrl) && (
          <div className="flex justify-center mb-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl">
              {categories.filter(c => c.imageUrl).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/tienda/categoria/${cat.slug}`}
                  className="group relative aspect-[4/3] overflow-hidden"
                >
                  <Image
                    src={cat.imageUrl!}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 250px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                    <span className="font-semibold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}>
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Info + Filters */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)" }}>
            Mostrando {skip + 1}-{Math.min(skip + pageSize, totalCount)} de{" "}
            {totalCount.toLocaleString()} productos
          </p>

          {/* Sort buttons */}
          <div className="flex gap-2 flex-wrap">
            <Link
              href={buildSortUrl("newest")}
              className="text-[13px] px-4 py-2 transition-colors"
              style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)", backgroundColor: sortOption === "newest" ? "var(--brand-color)" : "color-mix(in srgb, var(--text-primary) 10%, transparent)" }}
            >
              Recientes
            </Link>
            <Link
              href={buildSortUrl("popular")}
              className="text-[13px] px-4 py-2 transition-colors"
              style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)", backgroundColor: sortOption === "popular" ? "var(--brand-color)" : "color-mix(in srgb, var(--text-primary) 10%, transparent)" }}
            >
              Populares
            </Link>
            <Link
              href={buildSortUrl("price_asc")}
              className="text-[13px] px-4 py-2 transition-colors"
              style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)", backgroundColor: sortOption === "price_asc" ? "var(--brand-color)" : "color-mix(in srgb, var(--text-primary) 10%, transparent)" }}
            >
              Precio ↑
            </Link>
            <Link
              href={buildSortUrl("price_desc")}
              className="text-[13px] px-4 py-2 transition-colors"
              style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)", backgroundColor: sortOption === "price_desc" ? "var(--brand-color)" : "color-mix(in srgb, var(--text-primary) 10%, transparent)" }}
            >
              Precio ↓
            </Link>
          </div>
        </div>

        {/* 4. Products Grid - 3 columns */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: Number(product.price),
                  compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
                  images: product.images,
                  stock: product.stock,
                  trackInventory: product.trackInventory,
                  productType: product.productType,
                  performers: product.performers.map((pp) => pp.performer),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-8">
            <p style={{ color: "var(--text-muted)" }}>No hay productos disponibles</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            {page > 1 && (
              <Link
                href={buildUrl(page - 1)}
                className="px-4 py-2 text-sm hover:opacity-90 transition-colors"
                style={{ backgroundColor: "color-mix(in srgb, var(--text-primary) 10%, transparent)", color: "var(--text-primary)", fontFamily: "var(--global-font)" }}
              >
                Anterior
              </Link>
            )}

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <Link
                    key={pageNum}
                    href={buildUrl(pageNum)}
                    className="px-3 py-2 text-sm transition-colors"
                    style={{
                      fontFamily: "var(--global-font)",
                      color: "var(--text-primary)",
                      backgroundColor: page === pageNum ? "var(--brand-color)" : "color-mix(in srgb, var(--text-primary) 10%, transparent)",
                    }}
                  >
                    {pageNum}
                  </Link>
                )
              })}
            </div>

            {page < totalPages && (
              <Link
                href={buildUrl(page + 1)}
                className="px-4 py-2 text-sm hover:opacity-90 transition-colors"
                style={{ backgroundColor: "color-mix(in srgb, var(--text-primary) 10%, transparent)", color: "var(--text-primary)", fontFamily: "var(--global-font)" }}
              >
                Siguiente
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
