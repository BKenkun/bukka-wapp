import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { IconPlus, IconClock, IconCheck, IconArchive } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PagesDataTable } from "./pages-data-table"

interface SearchParams {
  page?: string
  pageSize?: string
  status?: string
  search?: string
}

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20
  const skip = (page - 1) * pageSize

  const where = {
    ...(params.status && { status: params.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" }),
    ...(params.search && {
      OR: [
        { title: { contains: params.search, mode: "insensitive" as const } },
        { slug: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [pages, totalCount, stats] = await Promise.all([
    prisma.page.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.page.count({ where }),
    prisma.page.groupBy({
      by: ["status"],
      _count: true,
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  const statusStats = {
    draft: stats.find((s) => s.status === "DRAFT")?._count || 0,
    published: stats.find((s) => s.status === "PUBLISHED")?._count || 0,
    archived: stats.find((s) => s.status === "ARCHIVED")?._count || 0,
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Páginas</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona las páginas estáticas y avisos legales
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pages/new">
            <IconPlus className="mr-2 size-4" />
            Nueva Página
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconClock className="size-4 text-yellow-500" />
              Borradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconCheck className="size-4 text-green-500" />
              Publicadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconArchive className="size-4 text-gray-500" />
              Archivadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.archived}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <PagesDataTable
        pages={pages}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  )
}
