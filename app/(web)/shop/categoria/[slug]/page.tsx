import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/shop/product-card"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const category = await prisma.shopCategory.findUnique({
    where: { slug },
    select: { name: true },
  })

  if (!category) return { title: "Category not found" }

  return {
    title: category.name,
    description: `${category.name} products in our shop`,
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const search = await searchParams
  const page = Number(search.page) || 1
  const pageSize = 12
  const skip = (page - 1) * pageSize

  // Get category
  const category = await prisma.shopCategory.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true, imageUrl: true },
  })

  if (!category) {
    notFound()
  }

  // Sort option
  const sortOption = search.sort || "newest"
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

  // Fetch products and all categories
  const [productsRaw, totalCount, allCategories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ProductToCategory: {
          some: { categoryId: category.id },
        },
      },
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
    prisma.product.count({
      where: {
        status: "ACTIVE",
        ProductToCategory: {
          some: { categoryId: category.id },
        },
      },
    }),
    prisma.shopCategory.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true, imageUrl: true },
    }),
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
  const otherCategories = allCategories.filter(c => c.slug !== slug && c.imageUrl)

  const buildUrl = (newPage: number) => {
    const urlParams = new URLSearchParams()
    urlParams.set("page", newPage.toString())
    if (sortOption !== "newest") urlParams.set("sort", sortOption)
    return `/tienda/categoria/${slug}?${urlParams.toString()}`
  }

  const buildSortUrl = (sort: string) => {
    const urlParams = new URLSearchParams()
    urlParams.set("sort", sort)
    urlParams.set("page", "1")
    return `/tienda/categoria/${slug}?${urlParams.toString()}`
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Category Header */}
      {category.imageUrl ? (
        <div className="relative w-full aspect-[21/9] overflow-hidden">
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-7xl mx-auto px-6 pb-8 md:pb-12">
              <h1
                className="font-bold text-3xl md:text-5xl text-white mb-2"
                style={{ fontFamily: "var(--global-font)" }}
              >
                {category.name}
              </h1>
              {category.description && (
                <p className="text-base md:text-lg text-gray-300 max-w-2xl">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <section
          className="py-16"
          style={{ backgroundColor: "var(--surface-bg, #f9fafb)" }}
        >
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: "var(--text-primary, #000)", fontFamily: "var(--global-font)" }}
            >
              {category.name}
            </h1>
            {category.description && (
              <p
                className="text-lg max-w-2xl mx-auto"
                style={{ color: "var(--text-muted, #6b7280)" }}
              >
                {category.description}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Breadcrumb + Back */}
      <div className="max-w-7xl mx-auto w-full px-6 mt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shop" style={{ color: "var(--text-muted)" }}>Shop</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator style={{ color: "var(--text-muted)" }} />
            <BreadcrumbItem>
              <BreadcrumbPage style={{ color: "var(--text-primary)" }}>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary, #000)" }}
              >
                {totalCount} {totalCount === 1 ? "product" : "products"}
              </p>
            </div>

            {/* Sort pills */}
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

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                className="text-lg mb-4"
                style={{ color: "var(--text-muted, #6b7280)" }}
              >
                No products in this category
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
              >
                View All Products
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              {page > 1 && (
                <Link
                  href={buildUrl(page - 1)}
                  className="px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-colors"
                  style={{
                    backgroundColor: "var(--surface-bg, #f3f4f6)",
                    color: "var(--text-primary, #000)",
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
                  }}
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Other Categories */}
      {otherCategories.length > 0 && (
        <section className="py-16" style={{ backgroundColor: "var(--surface-bg, #f9fafb)" }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2
              className="text-2xl md:text-3xl font-bold mb-8 text-center"
              style={{ color: "var(--text-primary, #000)" }}
            >
              Other Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {otherCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/tienda/categoria/${cat.slug}`}
                  className="group relative overflow-hidden h-48"
                >
                  <Image
                    src={cat.imageUrl!}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 250px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                    <span className="text-white font-bold text-lg">{cat.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
