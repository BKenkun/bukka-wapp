import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ProductSidebar } from "@/components/product-sidebar"
import { VideoActionButtons } from "@/components/video-action-buttons"
import { VideoDetailLayout } from "@/components/video-detail-layout"
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

  return { title: "Not found" }
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

  // Cargar settings del overlay de bloqueo (textos y estilo configurables desde admin)
  const videoAccessSettings = await getVideoAccessSettings()
  const lockConfig = videoAccessSettings.lockScreen

  // Determinar si el video está bloqueado para este usuario
  let isLocked = false
  let lockReason = ""
  let requiredTier = ""

  if (video.minTierPlan) {
    const userLevel = userPlan?.level ?? 0
    if (userLevel < video.minTierPlan.level) {
      isLocked = true
      lockReason = lockConfig.messageLockedByTier
      requiredTier = video.minTierPlan.name
    }
  }

  if (video.isDiamondExclusive && !userPlan?.canAccessExclusive) {
    isLocked = true
    lockReason = lockConfig.messageLockedByExclusive
    requiredTier = "Diamond"
  }

  if (video.isLimitedEdition && video.limitedAccessUntil) {
    const now = new Date()
    if (now < video.limitedAccessUntil && !userPlan?.canAccessLimitedEdition) {
      isLocked = true
      lockReason = lockConfig.messageLockedByEarlyAccess
      requiredTier = "Platinum"
    }
  }

  if (!session && video.minTierPlan) {
    isLocked = true
    lockReason = lockConfig.messageLockedByNoSession
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

  // Determine dynamic grid spans based on performer count (matches dev_test2 exactly)
  const performerCount = actresses.length
  const detailsSpan = performerCount === 0
    ? "lg:col-span-10"
    : performerCount === 1
      ? "lg:col-span-8"
      : performerCount === 2
        ? "lg:col-span-6"
        : "lg:col-span-5"
  const starringSpan = performerCount === 1
    ? "lg:col-span-2"
    : performerCount === 2
      ? "lg:col-span-4"
      : "lg:col-span-5"

  return (
    <main className="flex-1 flex flex-col">
      <div className="pt-16">
        {/* Section 1: Player + Products Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-1">
          <div className="lg:col-span-3">
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
                    <span className="line-clamp-1 max-w-[200px]">Previous</span>
                  </Link>
                ) : <span />}
                {nextVideo ? (
                  <Link
                    href={`/videos/${nextVideo.slug}`}
                    className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-muted)" }}
                    title={nextVideo.title}
                  >
                    <span className="line-clamp-1 max-w-[200px]">Next</span>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : <span />}
              </div>
            )}
          </div>

          {/* Products Sidebar - Card wrapper like dev_test2 */}
          <div className="lg:col-span-1 flex flex-col h-full hidden lg:flex">
            <div
              className="flex-1 rounded-none flex flex-col"
              style={{ backgroundColor: "color-mix(in srgb, var(--surface-bg, #1a1a1a) 50%, transparent)" }}
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
                  Related Products
                </h3>
              </div>
              <div className="flex-1 overflow-hidden p-2">
                <div className="h-full max-h-[calc(100vh-10rem)] lg:max-h-full overflow-y-auto">
                  <div className="space-y-2 pr-2">
                    <ProductSidebar products={sidebarProducts} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Video Details + Starring */}
        <div className="px-4 md:px-6 py-8">
          <div className="grid lg:grid-cols-10 gap-8 items-start">
            {/* Video Details */}
            <div className={`transition-all duration-300 ${detailsSpan}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>
                    {video.title}
                  </h1>
                  {/* Performer links */}
                  {performersList.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      {performersList.map((p, i) => (
                        <span key={p.id}>
                          <Link
                            href={`/performers/${p.slug}`}
                            className="hover:underline"
                            style={{ color: "var(--link-color)" }}
                          >
                            {p.name}
                          </Link>
                          {i < performersList.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Stats to the right of title on desktop, below on mobile */}
                <div className="sm:mt-2 sm:ml-4 flex-shrink-0">
                  <VideoActionButtons
                    videoId={video.id}
                    videoSlug={video.slug}
                    userId={userId}
                    canDownload={canDownload && !isLocked}
                    favoriteCount={video._count.favorites}
                    viewCount={(video.viewCount + 1).toLocaleString()}
                  />
                </div>
              </div>

              {/* Description */}
              {video.description && (
                <p className="mt-6" style={{ color: "var(--text-muted)" }}>
                  {video.description}
                </p>
              )}

              {/* Tags */}
              {tagsList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--text-primary) 10%, transparent)",
                        color: "var(--text-muted)",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Extra info: date, duration, categories */}
              <div className="mt-6 space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                {video.releaseDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>Fecha:</span>
                    <span>{new Date(video.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                )}
                {video.duration != null && video.duration > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>Duracion:</span>
                    <span>{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")} min</span>
                  </div>
                )}
                {video.categories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>Categorias:</span>
                    <span>{video.categories.map((c) => c.category.name).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Starring - matches dev_test2 exactly */}
            {performerCount > 0 && (
              <div className={`space-y-4 transition-all duration-300 ${starringSpan}`}>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Starring
                </h3>
                <div className="flex space-x-4">
                  {actresses.map((actress) => (
                    <div key={actress.id} className="w-full">
                      <Link
                        href={`/performers/${actress.slug}`}
                        className="group block text-left"
                      >
                        <div className="overflow-hidden">
                          <Image
                            src={actress.imageUrl}
                            alt={actress.name}
                            width={400}
                            height={600}
                            className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 20vw"
                          />
                        </div>
                        <div className="pt-2">
                          <h4
                            className="font-medium uppercase tracking-wide text-sm relative h-5"
                            style={{ color: "var(--text-primary)" }}
                          >
                            <span className="absolute left-0 transition-opacity duration-300 group-hover:opacity-0">
                              {actress.name}
                            </span>
                            <span className="absolute left-0 font-bold transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                              VER
                            </span>
                          </h4>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gallery/Comments Tabs + Related Videos - inside same px section like dev_test2 */}
          <section className="mt-8">
            <VideoDetailLayout
              galleryImages={galleryImages}
              videoId={video.id}
              videoSlug={video.slug}
              comments={commentsList}
              commentCount={video._count.comments}
              categoryIds={categoryIds}
            />
          </section>
        </div>

        {/* Mobile: Products (shown below on small screens) */}
        <div className="lg:hidden px-4 md:px-6 pb-4">
          <h3 className="text-sm font-semibold tracking-wide mb-3" style={{ color: "var(--text-primary)" }}>
            Related Products
          </h3>
          <ProductSidebar products={sidebarProducts} />
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
