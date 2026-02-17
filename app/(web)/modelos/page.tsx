import { prisma } from "@/lib/prisma"
import { ModelosPageClient } from "./modelos-page-client"
import { HomeSectionRenderer } from "@/components/home/home-section-renderer"

interface SearchParams {
  page?: string
  sort?: string
  letter?: string
}

export default async function ModelosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 24
  const skip = (page - 1) * pageSize
  const letterFilter = params.letter || ""

  // Determinar ordenación
  const sortOption = params.sort || "popularity"
  let orderBy: Record<string, string> = { videoCount: "desc" }

  switch (sortOption) {
    case "newest":
      orderBy = { createdAt: "desc" }
      break
    case "oldest":
      orderBy = { createdAt: "asc" }
      break
    case "name":
      orderBy = { name: "asc" }
      break
    case "popularity":
    default:
      orderBy = { videoCount: "desc" }
  }

  // Construir filtro por letra
  type WhereClause = {
    name?: {
      startsWith: string
      mode: "insensitive"
    } | {
      in: string[]
    }
  }

  const whereClause: WhereClause = {}

  if (letterFilter && letterFilter !== "Todo") {
    // Parse letter range like "A-C" or single letter
    if (letterFilter.includes("-")) {
      const [start, end] = letterFilter.split("-")
      const letters: string[] = []
      for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
        letters.push(String.fromCharCode(i))
      }
      // Filter by first letter being in the range
      whereClause.name = {
        in: letters.flatMap(l => [l.toUpperCase(), l.toLowerCase()])
      }
    } else {
      whereClause.name = {
        startsWith: letterFilter,
        mode: "insensitive"
      }
    }
  }

  // Build the Prisma where clause for letter filtering
  const prismaWhere = letterFilter && letterFilter !== "Todo"
    ? {
        OR: letterFilter.includes("-")
          ? (() => {
              const [start, end] = letterFilter.split("-")
              const conditions = []
              for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
                conditions.push({
                  name: { startsWith: String.fromCharCode(i), mode: "insensitive" as const }
                })
              }
              return conditions
            })()
          : [{ name: { startsWith: letterFilter, mode: "insensitive" as const } }]
      }
    : {}

  const [performers, totalCount, ctaSection] = await Promise.all([
    prisma.performer.findMany({
      where: prismaWhere,
      skip,
      take: pageSize,
      orderBy,
      select: {
        id: true,
        slug: true,
        name: true,
        profileImage: true,
        verified: true,
        _count: { select: { VideoPerformer: true } },
        VideoPerformer: {
          select: {
            video: {
              select: {
                viewCount: true,
              },
            },
          },
        },
      },
    }),
    prisma.performer.count({ where: prismaWhere }),
    prisma.homeSection.findFirst({
      where: { type: "CTA_BANNER", enabled: true },
      select: { id: true, type: true, title: true, enabled: true, order: true, config: true },
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Transformar datos para el grid
  const actresses = performers.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: p.profileImage || "/woman-in-black-bikini-on-beach.jpg",
    videoCount: p._count.VideoPerformer,
    totalViews: p.VideoPerformer.reduce((sum, vp) => sum + vp.video.viewCount, 0),
    verified: p.verified,
  }))

  return (
    <>
      <ModelosPageClient
        actresses={actresses}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        sortOption={sortOption}
        letterFilter={letterFilter}
        skip={skip}
        pageSize={pageSize}
      />
      {ctaSection && (
        <HomeSectionRenderer
          section={{
            ...ctaSection,
            config: ctaSection.config as Record<string, unknown> | null,
          }}
        />
      )}
    </>
  )
}
