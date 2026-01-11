import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DiscountBanner } from "@/components/discount-banner"
import { ProductCard } from "@/components/shop/product-card"

interface SearchParams {
  page?: string
  sort?: string
  category?: string
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

  // Determinar ordenación
  const sortOption = params.sort || "newest"
  let orderBy: Record<string, string> = { createdAt: "desc" }

  switch (sortOption) {
    case "popular":
      orderBy = { createdAt: "desc" } // TODO: añadir campo de popularidad/ventas
      break
    case "price_asc":
      orderBy = { price: "asc" }
      break
    case "price_desc":
      orderBy = { price: "desc" }
      break
    case "name":
      orderBy = { name: "asc" }
      break
    case "newest":
    default:
      orderBy = { createdAt: "desc" }
  }

  // Filtro por categoría
  const categorySlug = params.category
  const whereClause: Record<string, unknown> = {
    status: "ACTIVE",
  }

  if (categorySlug) {
    whereClause.categories = {
      some: {
        category: { slug: categorySlug },
      },
    }
  }

  // Fetch productos y categorías en paralelo
  const [products, totalCount, categories, selectedCategory] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy,
      include: {
        performer: {
          select: { name: true, slug: true },
        },
      },
    }),
    prisma.product.count({ where: whereClause }),
    prisma.shopCategory.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    categorySlug
      ? prisma.shopCategory.findUnique({
          where: { slug: categorySlug },
          select: { name: true },
        })
      : null,
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Construir URL base para paginación
  const buildUrl = (newPage: number) => {
    const urlParams = new URLSearchParams()
    urlParams.set("page", newPage.toString())
    if (sortOption !== "newest") urlParams.set("sort", sortOption)
    if (categorySlug) urlParams.set("category", categorySlug)
    return `/tienda?${urlParams.toString()}`
  }

  const buildSortUrl = (sort: string) => {
    const urlParams = new URLSearchParams()
    urlParams.set("sort", sort)
    urlParams.set("page", "1")
    if (categorySlug) urlParams.set("category", categorySlug)
    return `/tienda?${urlParams.toString()}`
  }

  const buildCategoryUrl = (catSlug: string | null) => {
    const urlParams = new URLSearchParams()
    urlParams.set("page", "1")
    if (sortOption !== "newest") urlParams.set("sort", sortOption)
    if (catSlug) urlParams.set("category", catSlug)
    return `/tienda?${urlParams.toString()}`
  }

  return (
    <main className="flex-1 flex flex-col bg-black text-white">
      <div>
        <DiscountBanner />
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 mt-[25px]">
        {/* Hero Section */}
        <div className="relative w-full aspect-[21/9] mb-8">
          <Image src="/images/shop.jpg" alt="Tienda" fill className="object-cover" sizes="100vw" />
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-[10px]">
            <h1
              className="font-montserrat font-bold"
              style={{
                color: "#E5E7EB",
                fontSize: "30px",
                lineHeight: "36px",
              }}
            >
              {selectedCategory ? selectedCategory.name : "Tienda"}
            </h1>
            <p className="text-white font-montserrat text-base font-normal">
              {selectedCategory
                ? `Productos de la categoría ${selectedCategory.name}`
                : "Descubre nuestra colección exclusiva de productos"}
            </p>
            <p className="text-white font-montserrat text-sm font-normal">
              Mostrando {skip + 1}-{Math.min(skip + pageSize, totalCount)} de{" "}
              {totalCount.toLocaleString()} productos
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            {/* Ordenamiento */}
            <div className="flex gap-2 flex-wrap">
              <Link
                href={buildSortUrl("newest")}
                className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] ${
                  sortOption === "newest" ? "bg-[#FA4860]" : "bg-[#00B1DE]"
                }`}
              >
                Más recientes
              </Link>
              <Link
                href={buildSortUrl("popular")}
                className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] ${
                  sortOption === "popular" ? "bg-[#FA4860]" : "bg-[#00B1DE]"
                }`}
              >
                Populares
              </Link>
              <Link
                href={buildSortUrl("price_asc")}
                className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] ${
                  sortOption === "price_asc" ? "bg-[#FA4860]" : "bg-[#00B1DE]"
                }`}
              >
                Precio ↑
              </Link>
              <Link
                href={buildSortUrl("price_desc")}
                className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] ${
                  sortOption === "price_desc" ? "bg-[#FA4860]" : "bg-[#00B1DE]"
                }`}
              >
                Precio ↓
              </Link>
            </div>

            {/* Categorías */}
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Link
                  href={buildCategoryUrl(null)}
                  className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] ${
                    !categorySlug ? "bg-[#FA4860]" : "bg-gray-700"
                  }`}
                >
                  Todas
                </Link>
                {categories.slice(0, 5).map((cat) => (
                  <Link
                    key={cat.id}
                    href={buildCategoryUrl(cat.slug)}
                    className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] ${
                      categorySlug === cat.slug ? "bg-[#FA4860]" : "bg-gray-700"
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
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
                  performer: product.performer,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-8">
            <p className="text-gray-400">No hay productos disponibles</p>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            {page > 1 && (
              <Link
                href={buildUrl(page - 1)}
                className="px-4 py-2 bg-[#00B1DE] text-white font-montserrat text-sm"
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
                        : "bg-gray-800 text-white hover:bg-gray-700"
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
                className="px-4 py-2 bg-[#00B1DE] text-white font-montserrat text-sm"
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
