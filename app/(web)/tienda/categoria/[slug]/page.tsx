import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/shop/product-card"

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

  if (!category) return { title: "Categoría no encontrada" }

  return {
    title: category.name,
    description: `Productos de ${category.name} en nuestra tienda`,
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
    <main className="flex-1 flex flex-col bg-black text-white">
      <div className="w-full mx-auto px-4 md:px-6 pt-6">
        {/* Category Banner */}
        {category.imageUrl && (
          <div className="relative w-full aspect-[21/9] mb-8 overflow-hidden">
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <h1 className="font-montserrat font-bold text-3xl md:text-5xl text-white">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-white/80 font-montserrat text-base md:text-lg mt-2 max-w-2xl">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Title if no banner */}
        {!category.imageUrl && (
          <div className="text-center mb-8">
            <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-white mb-3">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-white/80 font-montserrat text-base max-w-2xl mx-auto">
                {category.description}
              </p>
            )}
          </div>
        )}

        {/* Other Categories */}
        {allCategories.filter(c => c.imageUrl && c.slug !== slug).length > 0 && (
          <div className="flex justify-center mb-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl">
              {allCategories.filter(c => c.imageUrl && c.slug !== slug).map((cat) => (
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
                    <span className="text-white font-montserrat font-semibold text-base">
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
          <div className="flex items-center gap-4">
            <Link
              href="/tienda"
              className="text-[#FA4860] font-montserrat text-sm hover:underline"
            >
              ← Volver a Tienda
            </Link>
            <p className="text-white/60 font-montserrat text-sm">
              {totalCount} {totalCount === 1 ? "producto" : "productos"}
            </p>
          </div>

          {/* Sort buttons */}
          <div className="flex gap-2 flex-wrap">
            <Link
              href={buildSortUrl("newest")}
              className={`text-white font-montserrat text-[13px] px-4 py-2 transition-colors ${
                sortOption === "newest" ? "bg-[#FA4860]" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              Recientes
            </Link>
            <Link
              href={buildSortUrl("popular")}
              className={`text-white font-montserrat text-[13px] px-4 py-2 transition-colors ${
                sortOption === "popular" ? "bg-[#FA4860]" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              Populares
            </Link>
            <Link
              href={buildSortUrl("price_asc")}
              className={`text-white font-montserrat text-[13px] px-4 py-2 transition-colors ${
                sortOption === "price_asc" ? "bg-[#FA4860]" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              Precio ↑
            </Link>
            <Link
              href={buildSortUrl("price_desc")}
              className={`text-white font-montserrat text-[13px] px-4 py-2 transition-colors ${
                sortOption === "price_desc" ? "bg-[#FA4860]" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              Precio ↓
            </Link>
          </div>
        </div>

        {/* Products Grid - 3 columns */}
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
            <p className="text-gray-400">No hay productos en esta categoría</p>
            <Link
              href="/tienda"
              className="text-[#FA4860] font-montserrat text-sm hover:underline mt-4 inline-block"
            >
              Ver todos los productos
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            {page > 1 && (
              <Link
                href={buildUrl(page - 1)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-montserrat text-sm"
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
                    className={`px-3 py-2 font-montserrat text-sm ${
                      page === pageNum
                        ? "bg-[#FA4860] text-white"
                        : "bg-zinc-800 text-white hover:bg-zinc-700"
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              })}
            </div>

            {page < totalPages && (
              <Link
                href={buildUrl(page + 1)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-montserrat text-sm"
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
