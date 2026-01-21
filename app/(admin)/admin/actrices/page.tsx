import { prisma } from "@/lib/prisma"
import { PerformersDataTable } from "./performers-data-table"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"

interface SearchParams {
  page?: string
  pageSize?: string
  search?: string
}

export default async function AdminPerformersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20
  const skip = (page - 1) * pageSize

  const where = {
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: "insensitive" as const } },
        { slug: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [performers, totalCount] = await Promise.all([
    prisma.performer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            VideoPerformer: true,
            favorites: true,
            products: true,
          },
        },
        User: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.performer.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Gestión de Actrices</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} actrices en total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/actrices/new">
            <IconPlus className="mr-2 size-4" />
            Nueva Actriz
          </Link>
        </Button>
      </div>

      <PerformersDataTable
        performers={performers}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  )
}
