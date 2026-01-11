import { prisma } from "@/lib/prisma"
import { ProductsDataTable } from "./products-data-table"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"

interface SearchParams {
  page?: string
  status?: string
  riskLevel?: string
  search?: string
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where = {
    ...(params.status && { status: params.status as "DRAFT" | "ACTIVE" | "ARCHIVED" }),
    ...(params.riskLevel && { riskLevel: params.riskLevel as "LOW_RISK" | "HIGH_RISK" }),
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: "insensitive" as const } },
        { slug: { contains: params.search, mode: "insensitive" as const } },
        { sku: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [products, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        performer: {
          select: { id: true, name: true, slug: true },
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            favorites: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
    prisma.shopCategory.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Gestión de Productos</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} productos en total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <IconPlus className="mr-2 size-4" />
            Nuevo Producto
          </Link>
        </Button>
      </div>

      <ProductsDataTable
        products={products}
        categories={categories}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  )
}
