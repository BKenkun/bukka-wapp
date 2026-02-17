import { prisma } from "@/lib/prisma"
import { HomeSectionRenderer } from "@/components/home/home-section-renderer"
import { VideosPageClient } from "./videos-page-client"
import { getVideoToken, getVideoPreviewUrl } from "@/lib/mux/client"

interface SearchParams {
  page?: string
  sort?: string
  category?: string
  performers?: string
  tags?: string
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 12
  const skip = (page - 1) * pageSize

  // Parse filters
  const categorySlug = params.category
  const performerSlugs = params.performers?.split(",").filter(Boolean) || []
  const tagSlugs = params.tags?.split(",").filter(Boolean) || []
  const sortOption = params.sort || "newest"

  // Build order by
  let orderBy: Record<string, string> = { releaseDate: "desc" }
  switch (sortOption) {
    case "popular":
      orderBy = { viewCount: "desc" }
      break
    case "oldest":
      orderBy = { releaseDate: "asc" }
      break
    case "title":
      orderBy = { title: "asc" }
      break
    case "newest":
    default:
      orderBy = { releaseDate: "desc" }
  }

  // Build where clause
  const whereClause: Record<string, unknown> = {
    status: "PUBLISHED",
  }

  if (categorySlug) {
    whereClause.categories = {
      some: {
        category: { slug: categorySlug },
      },
    }
  }

  if (performerSlugs.length > 0) {
    whereClause.performers = {
      some: {
        performer: { slug: { in: performerSlugs } },
      },
    }
  }

  if (tagSlugs.length > 0) {
    whereClause.tags = {
      some: {
        tag: { slug: { in: tagSlugs } },
      },
    }
  }

  // Fetch all data in parallel
  const [videos, totalCount, categories, performers, tags, selectedCategory, ctaSection] = await Promise.all([
    prisma.video.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy,
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnailUrl: true,
        previewUrl: true,
        previewStartTime: true,
        previewEndTime: true,
        muxPlaybackId: true,
        viewCount: true,
        likeCount: true,
        releaseDate: true,
        performers: {
          include: {
            performer: {
              select: { name: true, slug: true },
            },
          },
        },
        categories: {
          include: {
            category: {
              select: { name: true },
            },
          },
          take: 1,
        },
      },
    }),
    prisma.video.count({ where: whereClause }),
    prisma.videoCategory.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.performer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    categorySlug
      ? prisma.videoCategory.findUnique({
          where: { slug: categorySlug },
          select: { name: true },
        })
      : null,
    prisma.homeSection.findFirst({
      where: { type: "CTA_BANNER", enabled: true },
      select: { id: true, type: true, title: true, enabled: true, order: true, config: true },
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Transform videos for the grid with signed preview URLs
  const transformedVideos = await Promise.all(
    videos.map(async (video) => {
      // Use custom previewUrl if available, otherwise use signed Mux MP4
      let videoPreviewUrl = video.previewUrl || undefined

      if (!videoPreviewUrl && video.muxPlaybackId) {
        try {
          // Generate signed token for Mux MP4 preview
          const token = await getVideoToken(video.muxPlaybackId)
          videoPreviewUrl = getVideoPreviewUrl(video.muxPlaybackId, token, "medium")
        } catch (error) {
          console.warn(`Failed to generate preview token for video ${video.id}:`, error)
          // Fallback: leave previewUrl undefined
        }
      }

      return {
        id: video.id,
        slug: video.slug,
        title: video.title,
        views: formatViews(video.viewCount),
        imageUrl: video.thumbnailUrl || "/fashion-model-portrait.png",
        previewUrl: videoPreviewUrl,
        previewStartTime: video.previewStartTime,
        previewEndTime: video.previewEndTime,
        isVerified: true,
        category: video.categories[0]?.category.name,
        performers: video.performers.map((p) => ({ name: p.performer.name, slug: p.performer.slug })),
        publishedAt: video.releaseDate,
      }
    })
  )

  // Get active filter names for display
  const activeFilters = {
    category: selectedCategory?.name,
    performers: performerSlugs.length > 0 ? performerSlugs.length : undefined,
    tags: tagSlugs.length > 0 ? tagSlugs.length : undefined,
  }

  return (
    <main className="min-h-screen flex flex-col font-sans">
      <VideosPageClient
        videos={transformedVideos}
        categories={categories}
        performers={performers}
        tags={tags}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        sortOption={sortOption}
        selectedCategory={categorySlug}
        selectedPerformers={performerSlugs}
        selectedTags={tagSlugs}
        activeFilters={activeFilters}
      />

      {/* CTA Banner from home config */}
      {ctaSection && (
        <HomeSectionRenderer
          section={{
            ...ctaSection,
            config: ctaSection.config as Record<string, unknown> | null,
          }}
        />
      )}
    </main>
  )
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(0)}K`
  }
  return views.toString()
}
