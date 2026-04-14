import { prisma } from "@/lib/prisma"
import { ModelosPageClient } from "./modelos-page-client"
import { HomeSectionRenderer } from "@/components/home/home-section-renderer"

interface SearchParams {
  page?: string
  sort?: string
  letter?: string
  verified?: string
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
  const verifiedFilter = params.verified === "true"

  // Sort
  const sortOption = params.sort || "relevance"
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
      orderBy = { videoCount: "desc" }
      break
    case "relevance":
    default:
      orderBy = { videoCount: "desc" }
  }

  // Build where clause
  const conditions: Record<string, unknown>[] = []

  if (verifiedFilter) {
    conditions.push({ verified: true })
  }

  if (letterFilter && letterFilter !== "All") {
    if (letterFilter.includes("-")) {
      const [start, end] = letterFilter.split("-")
      const letterConditions = []
      for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
        letterConditions.push({
          name: { startsWith: String.fromCharCode(i), mode: "insensitive" as const }
        })
      }
      conditions.push({ OR: letterConditions })
    } else {
      conditions.push({ name: { startsWith: letterFilter, mode: "insensitive" as const } })
    }
  }

  const prismaWhere = conditions.length > 0 ? { AND: conditions } : {}

  const [performers, totalCount, allPerformers, ctaSection] = await Promise.all([
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
    // Get all performer names to compute available letters
    prisma.performer.findMany({
      select: { name: true },
    }),
    prisma.homeSection.findFirst({
      where: { type: "CTA_BANNER", enabled: true },
      select: { id: true, type: true, title: true, enabled: true, order: true, config: true },
    }),
  ])

  // Compute available first letters
  const availableLetters = [...new Set(
    allPerformers.map(p => p.name.charAt(0).toUpperCase())
  )].sort()

  const totalPages = Math.ceil(totalCount / pageSize)

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
        verifiedFilter={verifiedFilter}
        availableLetters={availableLetters}
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
