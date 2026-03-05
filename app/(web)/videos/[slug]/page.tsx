import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { VideoInfoBar } from "@/components/video-info-bar"
import { ProductSidebar } from "@/components/product-sidebar"
import { VideoInformation } from "@/components/video-information"
import { VideoGallery } from "@/components/video-gallery"
import { SectionHeader } from "@/components/section-header"
import { ActressesGrid } from "@/components/actresses-grid"
import { RelatedContentTabs } from "@/components/related-content-tabs"
import { MuxVideoPlayer } from "@/components/mux-video-player"
import { VideoPlayer } from "@/components/video-player"
import { getVideoAccessSettings } from "@/lib/get-video-access-settings"
import { HomeSectionRenderer } from "@/components/home/home-section-renderer"
import { VideosPageClient } from "../videos-page-client"
import { getVideoToken, getVideoPreviewUrl } from "@/lib/mux/client"
import {
  getSystemCollectionBySlug,
  getVideosForSystemCollection,
  getVideoCountForSystemCollection,
} from "@/lib/system-collections"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    page?: string
    sort?: string
    performers?: string
    tags?: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  // Check if it's a system collection
  const systemCollection = await getSystemCollectionBySlug(slug)
  if (systemCollection && systemCollection.isEnabled) {
    return {
      title: `${systemCollection.name} - Videos`,
      description: systemCollection.description || `Videos ${systemCollection.name.toLowerCase()}`,
    }
  }

  // Check if it's a category
  const category = await prisma.videoCategory.findUnique({
    where: { slug },
    select: { name: true, description: true },
  })

  if (category) {
    return {
      title: `${category.name} - Videos`,
      description: category.description || `Videos de ${category.name}`,
    }
  }

  // Check if it's a video
  const video = await prisma.video.findUnique({
    where: { slug },
    select: { title: true, description: true },
  })

  if (video) {
    return {
      title: video.title,
      description: video.description || undefined,
    }
  }

  return { title: "No encontrado" }
}

export default async function VideoOrCategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params

  // First, check if the slug matches a system collection
  const systemCollection = await getSystemCollectionBySlug(slug)
  if (systemCollection && systemCollection.isEnabled) {
    return <SystemCollectionPage collection={systemCollection} searchParams={searchParams} />
  }

  // Then, check if the slug matches a category
  const category = await prisma.videoCategory.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true },
  })

  // If it's a category, render the category page
  if (category) {
    return <CategoryPage category={category} searchParams={searchParams} />
  }

  // Otherwise, render the video detail page
  return <VideoDetailPage slug={slug} />
}

// Category Page Component
async function CategoryPage({
  category,
  searchParams,
}: {
  category: { id: string; name: string; slug: string; description: string | null }
  searchParams: Promise<{
    page?: string
    sort?: string
    performers?: string
    tags?: string
  }>
}) {
  const search = await searchParams

  const page = Number(search.page) || 1
  const pageSize = 12
  const skip = (page - 1) * pageSize

  const performerSlugs = search.performers?.split(",").filter(Boolean) || []
  const tagSlugs = search.tags?.split(",").filter(Boolean) || []
  const sortOption = search.sort || "newest"

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

  const whereClause: Record<string, unknown> = {
    status: "PUBLISHED",
    categories: {
      some: {
        categoryId: category.id,
      },
    },
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

  const [videos, totalCount, categories, performers, tags, ctaSection] = await Promise.all([
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
    prisma.homeSection.findFirst({
      where: { type: "CTA_BANNER", enabled: true },
      select: { id: true, type: true, title: true, enabled: true, order: true, config: true },
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  const transformedVideos = await Promise.all(
    videos.map(async (video) => {
      let videoPreviewUrl = video.previewUrl || undefined

      if (!videoPreviewUrl && video.muxPlaybackId) {
        try {
          const token = await getVideoToken(video.muxPlaybackId)
          videoPreviewUrl = getVideoPreviewUrl(video.muxPlaybackId, token, "medium")
        } catch (error) {
          console.warn(`Failed to generate preview token for video ${video.id}:`, error)
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

  const activeFilters = {
    category: category.name,
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
        selectedCategory={category.slug}
        selectedPerformers={performerSlugs}
        selectedTags={tagSlugs}
        activeFilters={activeFilters}
        categoryTitle={category.name}
        categoryDescription={category.description}
        basePath={`/videos/${category.slug}`}
      />

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

// System Collection Page Component
async function SystemCollectionPage({
  collection,
  searchParams,
}: {
  collection: {
    id: string
    type: string
    slug: string
    name: string
    description: string | null
  }
  searchParams: Promise<{
    page?: string
  }>
}) {
  const search = await searchParams
  const page = Number(search.page) || 1
  const pageSize = 12
  const skip = (page - 1) * pageSize

  // Get videos for this system collection
  const [videos, totalCount, categories, performers, tags, ctaSection] = await Promise.all([
    getVideosForSystemCollection(collection.type as import("@prisma/client").SystemCollectionType, {
      skip,
      take: pageSize,
    }),
    getVideoCountForSystemCollection(collection.type as import("@prisma/client").SystemCollectionType),
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
    prisma.homeSection.findFirst({
      where: { type: "CTA_BANNER", enabled: true },
      select: { id: true, type: true, title: true, enabled: true, order: true, config: true },
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Transform videos
  const transformedVideos = await Promise.all(
    videos.map(async (video) => {
      let videoPreviewUrl = video.previewUrl || undefined

      if (!videoPreviewUrl && video.muxPlaybackId) {
        try {
          const token = await getVideoToken(video.muxPlaybackId)
          videoPreviewUrl = getVideoPreviewUrl(video.muxPlaybackId, token, "medium")
        } catch (error) {
          console.warn(`Failed to generate preview token for video ${video.id}:`, error)
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
        sortOption="newest"
        selectedPerformers={[]}
        selectedTags={[]}
        activeFilters={{}}
        categoryTitle={collection.name}
        categoryDescription={collection.description}
        basePath={`/videos/${collection.slug}`}
      />

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

// Video Detail Page Component
async function VideoDetailPage({ slug }: { slug: string }) {
  const video = await prisma.video.findUnique({
    where: { slug },
    include: {
      minTierPlan: {
        select: { id: true, slug: true, name: true, level: true },
      },
      performers: {
        include: {
          performer: {
            select: {
              id: true,
              slug: true,
              name: true,
              profileImage: true,
              verified: true,
            },
          },
        },
      },
      gallery: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          url: true,
          order: true,
        },
      },
      relatedProducts: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              price: true,
              images: true,
              status: true,
            },
          },
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      comments: {
        where: { parentId: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              SubscriptionPlan: {
                select: {
                  slug: true,
                  name: true,
                },
              },
            },
          },
          other_Comment: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: {
        select: { comments: true, favorites: true },
      },
    },
  })

  if (!video) {
    notFound()
  }

  // Incrementar contador de vistas
  await prisma.video.update({
    where: { id: video.id },
    data: { viewCount: { increment: 1 } },
  })

  // Get previous and next videos (by publishedAt order)
  const [prevVideo, nextVideo] = await Promise.all([
    prisma.video.findFirst({
      where: {
        status: "PUBLISHED",
        publishedAt: video.publishedAt ? { gt: video.publishedAt } : undefined,
        id: { not: video.id },
      },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true },
    }),
    prisma.video.findFirst({
      where: {
        status: "PUBLISHED",
        publishedAt: video.publishedAt ? { lt: video.publishedAt } : undefined,
        id: { not: video.id },
      },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
    }),
  ])

  // Obtener información del usuario y su plan de suscripción
  const session = await auth()
  let userPlan: {
    id: string
    slug: string
    level: number
    canDownload: boolean
    canAccessExclusive: boolean
    canAccessLimitedEdition: boolean
    maxVideoQuality: string
  } | null = null
  let userId: string | null = null

  if (session?.user?.id) {
    userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        SubscriptionPlan: {
          select: {
            id: true,
            slug: true,
            level: true,
            canDownload: true,
            canAccessExclusive: true,
            canAccessLimitedEdition: true,
            maxVideoQuality: true,
          },
        },
      },
    })
    userPlan = user?.SubscriptionPlan || null
  }

  // Determinar si el video está bloqueado para este usuario
  let isLocked = false
  let lockReason = ""
  let requiredTier = ""

  if (video.minTierPlan) {
    const userLevel = userPlan?.level ?? 0
    if (userLevel < video.minTierPlan.level) {
      isLocked = true
      lockReason = "Este contenido requiere una suscripción superior"
      requiredTier = video.minTierPlan.name
    }
  }

  if (video.isDiamondExclusive && !userPlan?.canAccessExclusive) {
    isLocked = true
    lockReason = "Contenido exclusivo para suscriptores Diamond"
    requiredTier = "Diamond"
  }

  if (video.isLimitedEdition && video.limitedAccessUntil) {
    const now = new Date()
    if (now < video.limitedAccessUntil && !userPlan?.canAccessLimitedEdition) {
      isLocked = true
      lockReason = "Acceso anticipado para suscriptores Platinum+"
      requiredTier = "Platinum"
    }
  }

  if (!session && video.minTierPlan) {
    isLocked = true
    lockReason = "Inicia sesión para ver este contenido"
    requiredTier = video.minTierPlan.name
  }

  const canDownload = userPlan?.canDownload ?? false

  const actresses = video.performers.map(({ performer }) => ({
    id: performer.id,
    slug: performer.slug,
    name: performer.name,
    imageUrl: performer.profileImage || "/woman-in-black-bikini-on-beach.jpg",
    verified: performer.verified || false,
  }))

  const sidebarProducts = video.relatedProducts
    .filter((vp) => vp.product.status === "ACTIVE")
    .map((vp) => ({
      id: vp.product.id,
      slug: vp.product.slug,
      imageUrl: vp.product.images[0] || "/placeholder-product.jpg",
      title: vp.product.name,
      price: Number(vp.product.price),
    }))

  const galleryImages = video.gallery.map((g) => ({
    src: g.url,
    alt: video.title,
  }))

  const performersList = video.performers.map(({ performer }) => ({
    id: performer.id,
    slug: performer.slug,
    name: performer.name,
  }))

  const tagsList = video.tags.map((t) => t.tag.name)
  const categoryIds = video.categories.map((c) => c.category.id)

  const commentsList = video.comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    likeCount: comment.likeCount,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.user.id,
      name: comment.user.name || "Usuario",
      image: comment.user.image,
      plan: comment.user.SubscriptionPlan,
    },
    replies: comment.other_Comment.map((reply) => ({
      id: reply.id,
      content: reply.content,
      likeCount: reply.likeCount,
      createdAt: reply.createdAt.toISOString(),
      author: {
        id: reply.user.id,
        name: reply.user.name || "Usuario",
        image: reply.user.image,
      },
    })),
  }))

  const hasMuxVideo = !!video.muxPlaybackId

  const videoAccessSettings = await getVideoAccessSettings()
  const lockConfig = videoAccessSettings.lockScreen

  return (
    <main className="flex-1 flex flex-col">
      <div className="px-4 md:px-8 flex-1 w-full">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
            <div className="lg:col-span-8">
              {hasMuxVideo ? (
                <MuxVideoPlayer
                  videoId={video.id}
                  videoSlug={video.slug}
                  playbackId={video.muxPlaybackId!}
                  title={video.title}
                  thumbnailUrl={video.thumbnailUrl}
                  viewerId={userId || undefined}
                  locked={isLocked}
                  lockedMessage={lockReason}
                  requiredTier={requiredTier}
                  lockConfig={lockConfig}
                />
              ) : (
                <VideoPlayer
                  thumbnailUrl={video.thumbnailUrl}
                  title={video.title}
                  isLocked={isLocked}
                  lockMessage={lockReason}
                  requiredTier={requiredTier}
                  lockConfig={lockConfig}
                />
              )}

              {/* Prev / Next video navigation */}
              {(prevVideo || nextVideo) && (
                <div
                  className="flex items-center justify-between py-2 px-1"
                  style={{ borderBottom: "1px solid var(--border-color)" }}
                >
                  {prevVideo ? (
                    <Link
                      href={`/videos/${prevVideo.slug}`}
                      className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                      style={{ color: "var(--text-muted)" }}
                      title={prevVideo.title}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="line-clamp-1 max-w-[200px]">Anterior</span>
                    </Link>
                  ) : <span />}
                  {nextVideo ? (
                    <Link
                      href={`/videos/${nextVideo.slug}`}
                      className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                      style={{ color: "var(--text-muted)" }}
                      title={nextVideo.title}
                    >
                      <span className="line-clamp-1 max-w-[200px]">Siguiente</span>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : <span />}
                </div>
              )}

              <div className="mt-0">
                <VideoInfoBar
                  title={video.title}
                  subscriberCount={video._count.favorites.toLocaleString()}
                  likePercentage={`${Math.round((video.likeCount / Math.max(video.viewCount, 1)) * 100)}%`}
                  commentCount={video._count.comments.toLocaleString()}
                  viewCount={(video.viewCount + 1).toLocaleString()}
                  videoSlug={video.slug}
                  videoId={video.id}
                  canDownload={canDownload && !isLocked}
                  userId={userId}
                />
              </div>

              <VideoInformation
                description={video.description}
                performers={performersList}
                tags={tagsList}
                releaseDate={video.releaseDate}
                duration={video.duration}
                categories={video.categories.map((c) => c.category)}
              />
            </div>

            <div className="lg:col-span-4">
              <ProductSidebar products={sidebarProducts} />
            </div>
          </div>

          {galleryImages.length > 0 && (
            <div className="mt-8">
              <VideoGallery images={galleryImages} />
            </div>
          )}

          {actresses.length > 0 && (
            <div className="mt-8">
              <SectionHeader title="ACTRICES EN ESTE VIDEO" />
              <div className="mt-6">
                <ActressesGrid actresses={actresses} isFilterOpen={false} />
              </div>
            </div>
          )}

          <div className="mt-8">
            <RelatedContentTabs
              videoId={video.id}
              videoSlug={video.slug}
              comments={commentsList}
              commentCount={video._count.comments}
              categoryIds={categoryIds}
            />
          </div>

          <div className="mb-8" />
        </div>
      </div>
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
