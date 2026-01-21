import { prisma } from "@/lib/prisma"
import { VideosDataTable } from "./videos-data-table"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"

interface SearchParams {
  page?: string
  pageSize?: string
  status?: string
  category?: string
  search?: string
}

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20
  const skip = (page - 1) * pageSize

  const where = {
    ...(params.status && { status: params.status as "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" }),
    ...(params.search && {
      OR: [
        { title: { contains: params.search, mode: "insensitive" as const } },
        { slug: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [videos, totalCount, categories] = await Promise.all([
    prisma.video.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        performers: {
          include: {
            performer: {
              select: { id: true, name: true, slug: true },
            },
          },
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
            comments: true,
            favorites: true,
          },
        },
        minTierPlan: {
          select: { name: true },
        },
      },
    }),
    prisma.video.count({ where }),
    prisma.videoCategory.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  const mappedVideos = videos.map((video) => ({
    ...video,
    minTier: video.minTierPlan?.name || "N/A",
  }))

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Gestión de Videos</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} videos en total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/videos/new">
            <IconPlus className="mr-2 size-4" />
            Nuevo Video
          </Link>
        </Button>
      </div>

      <VideosDataTable
        videos={mappedVideos}
        categories={categories}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  )
}
