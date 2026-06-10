import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/shop/product-card"
import { ShopSectionRenderer } from "@/components/shop/shop-section-renderer"

interface SearchParams {
  page?: string
  sort?: string
}

async function getShopSections() {
  try {
    const sections = await prisma.shopSection.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    })
    return sections
  } catch (error) {
    console.error("Error fetching shop sections:", error)
    return null
  }
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

  const [sections, productsRaw, totalCount] = await Promise.all([
    getShopSections(),
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
  ])

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

  // Separate sections: before PRODUCTS_GRID and after
  const sectionsBefore: typeof sections = []
  const sectionsAfter: typeof sections = []
  let foundProductsGrid = false

  if (sections && sections.length > 0) {
    for (const section of sections) {
      if (section.type === "PRODUCTS_GRID") {
        foundProductsGrid = true
        continue // We render our own products grid with pagination
      }
      if (foundProductsGrid) {
        sectionsAfter.push(section)
      } else {
        sectionsBefore.push(section)
      }
    }
  }

  const hasSections = sections && sections.length > 0

  return (
    <main className="flex-1 flex flex-col">
      {/* Sections BEFORE products grid */}
      {hasSections && sectionsBefore.map((section) => (
        <ShopSectionRenderer
          key={section.id}
          section={{
            ...section,
            config: section.config as Record<string, unknown> | null,
          }}
        />
      ))}

      {/* Products Section - always rendered with full pagination */}
      <section className="py-16" id="productos">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ color: "var(--text-primary, #000)", fontFamily: "var(--global-font)" }}
              >
                All Products
              </h2>
              <p
                className="text-sm"
                style={{ color: "var(--text-muted, #6b7280)", fontFamily: "var(--global-font)" }}
              >
                Showing {skip + 1}-{Math.min(skip + pageSize, totalCount)} of{" "}
                {totalCount.toLocaleString()} products
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className="text-sm"
                style={{ color: "var(--text-muted, #6b7280)" }}
              >
                Sort by:
              </span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "newest", label: "Newest" },
                  { value: "popular", label: "Popular" },
                  { value: "price_asc", label: "Price ↑" },
                  { value: "price_desc", label: "Price ↓" },
                ].map((option) => (
                  <Link
                    key={option.value}
                    href={buildSortUrl(option.value)}
                    className="text-sm px-4 py-2 transition-all font-medium"
                    style={{
                      color: sortOption === option.value ? "#fff" : "var(--text-primary, #000)",
                      fontFamily: "var(--global-font)",
                      backgroundColor: sortOption === option.value
                        ? "var(--brand-color, #E03E54)"
                        : "var(--surface-bg, #f3f4f6)",
                    }}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                    createdAt: product.createdAt?.toISOString(),
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p
                className="text-lg"
                style={{ color: "var(--text-muted, #6b7280)" }}
              >
                No products available
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              {page > 1 && (
                <Link
                  href={buildUrl(page - 1)}
                  className="px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-colors"
                  style={{
                    backgroundColor: "var(--surface-bg, #f3f4f6)",
                    color: "var(--text-primary, #000)",
                    fontFamily: "var(--global-font)",
                  }}
                >
                  Previous
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
                      className="w-10 h-10 flex items-center justify-center text-sm transition-colors font-medium"
                      style={{
                        fontFamily: "var(--global-font)",
                        color: page === pageNum ? "#fff" : "var(--text-primary, #000)",
                        backgroundColor: page === pageNum
                          ? "var(--brand-color, #E03E54)"
                          : "var(--surface-bg, #f3f4f6)",
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
                  className="px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-colors"
                  style={{
                    backgroundColor: "var(--surface-bg, #f3f4f6)",
                    color: "var(--text-primary, #000)",
                    fontFamily: "var(--global-font)",
                  }}
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sections AFTER products grid */}
      {hasSections && sectionsAfter.map((section) => (
        <ShopSectionRenderer
          key={section.id}
          section={{
            ...section,
            config: section.config as Record<string, unknown> | null,
          }}
        />
      ))}
    </main>
  )
}
