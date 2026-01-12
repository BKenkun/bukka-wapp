import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { DiscountBanner } from "@/components/discount-banner"
import { VideoInfoBar } from "@/components/video-info-bar"
import { ProductSidebar } from "@/components/product-sidebar"
import { VideoInformation } from "@/components/video-information"
import { VideoGallery } from "@/components/video-gallery"
import { SectionHeader } from "@/components/section-header"
import { ActressesGrid } from "@/components/actresses-grid"
import { RelatedContentTabs } from "@/components/related-content-tabs"
import { MuxVideoPlayer } from "@/components/mux-video-player"
import { VideoPlayer } from "@/components/video-player"

interface VideoDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { slug } = await params

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
              User: { select: { isVerified: true } },
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

  // 1. Video requiere tier mínimo
  if (video.minTierPlan) {
    const userLevel = userPlan?.level ?? 0
    if (userLevel < video.minTierPlan.level) {
      isLocked = true
      lockReason = "Este contenido requiere una suscripción superior"
      requiredTier = video.minTierPlan.name
    }
  }

  // 2. Video es Diamond Exclusive
  if (video.isDiamondExclusive && !userPlan?.canAccessExclusive) {
    isLocked = true
    lockReason = "Contenido exclusivo para suscriptores Diamond"
    requiredTier = "Diamond"
  }

  // 3. Video es Limited Edition (acceso anticipado)
  if (video.isLimitedEdition && video.limitedAccessUntil) {
    const now = new Date()
    if (now < video.limitedAccessUntil && !userPlan?.canAccessLimitedEdition) {
      isLocked = true
      lockReason = "Acceso anticipado para suscriptores Platinum+"
      requiredTier = "Platinum"
    }
  }

  // Si no hay sesión y el video requiere cualquier plan
  if (!session && video.minTierPlan) {
    isLocked = true
    lockReason = "Inicia sesión para ver este contenido"
    requiredTier = video.minTierPlan.name
  }

  // Permisos del usuario
  const canDownload = userPlan?.canDownload ?? false

  // Transformar performers para el grid de actrices
  const actresses = video.performers.map(({ performer }) => ({
    id: performer.id,
    slug: performer.slug,
    name: performer.name,
    imageUrl: performer.profileImage || "/woman-in-black-bikini-on-beach.jpg",
    verified: performer.User?.isVerified || false,
  }))

  // Transformar productos relacionados (solo activos)
  const sidebarProducts = video.relatedProducts
    .filter((vp) => vp.product.status === "ACTIVE")
    .map((vp) => ({
      id: vp.product.id,
      slug: vp.product.slug,
      imageUrl: vp.product.images[0] || "/placeholder-product.jpg",
      title: vp.product.name,
      price: Number(vp.product.price),
    }))

  // Transformar galería
  const galleryImages = video.gallery.map((g) => ({
    src: g.url,
    alt: video.title,
  }))

  // Transformar performers para VideoInformation
  const performersList = video.performers.map(({ performer }) => ({
    id: performer.id,
    slug: performer.slug,
    name: performer.name,
  }))

  // Transformar tags
  const tagsList = video.tags.map((t) => t.tag.name)

  // Transformar categorías IDs para videos relacionados
  const categoryIds = video.categories.map((c) => c.category.id)

  // Transformar comentarios
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

  // Determinar si tenemos video de Mux disponible
  const hasMuxVideo = !!video.muxPlaybackId

  return (
    <main className="flex-1 flex flex-col bg-black text-white">
      <div>
        <DiscountBanner />
      </div>

      <div className="px-4 md:px-8 flex-1 w-full">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
            <div className="lg:col-span-8">
              {/* Video Player */}
              {hasMuxVideo && !isLocked ? (
                <MuxVideoPlayer
                  videoId={video.id}
                  videoSlug={video.slug}
                  playbackId={video.muxPlaybackId!}
                  title={video.title}
                  thumbnailUrl={video.thumbnailUrl}
                  viewerId={userId || undefined}
                />
              ) : (
                <VideoPlayer
                  thumbnailUrl={video.thumbnailUrl}
                  title={video.title}
                  isLocked={isLocked}
                  lockMessage={lockReason}
                  requiredTier={requiredTier}
                />
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

          {/* Actresses in this video */}
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
