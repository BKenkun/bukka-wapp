import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DiscountBanner } from "@/components/discount-banner"
import { VideoPlayer } from "@/components/video-player"
import { VideoInfoBar } from "@/components/video-info-bar"
import { ProductSidebar } from "@/components/product-sidebar"
import { VideoInformation } from "@/components/video-information"
import { VideoGallery } from "@/components/video-gallery"
import { SectionHeader } from "@/components/section-header"
import { ActressesGrid } from "@/components/actresses-grid"
import { RelatedContentTabs } from "@/components/related-content-tabs"

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
      performers: {
        include: {
          performer: {
            select: {
              id: true,
              slug: true,
              name: true,
              profileImage: true,
              user: { select: { isVerified: true } },
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
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              subscriptionPlan: {
                select: {
                  slug: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          children: {
            include: {
              author: {
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

  // Transformar performers para el grid de actrices
  const actresses = video.performers.map(({ performer }) => ({
    id: performer.id,
    slug: performer.slug,
    name: performer.name,
    imageUrl: performer.profileImage || "/woman-in-black-bikini-on-beach.jpg",
    verified: performer.user?.isVerified || false,
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
      id: comment.author.id,
      name: comment.author.name || "Usuario",
      image: comment.author.image,
      plan: comment.author.subscriptionPlan,
    },
    replies: comment.children.map((reply) => ({
      id: reply.id,
      content: reply.content,
      likeCount: reply.likeCount,
      createdAt: reply.createdAt.toISOString(),
      author: {
        id: reply.author.id,
        name: reply.author.name || "Usuario",
        image: reply.author.image,
      },
    })),
  }))

  return (
    <main className="flex-1 flex flex-col bg-black text-white">
      <div>
        <DiscountBanner />
      </div>

      <div className="px-4 md:px-8 flex-1 w-full">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
            <div className="lg:col-span-8">
              <VideoPlayer
                thumbnailUrl={video.thumbnailUrl}
                title={video.title}
                isLocked={true}
              />
              <div className="mt-0">
                <VideoInfoBar
                  title={video.title}
                  subscriberCount={video._count.favorites.toLocaleString()}
                  likePercentage={`${Math.round((video.likeCount / Math.max(video.viewCount, 1)) * 100)}%`}
                  commentCount={video._count.comments.toLocaleString()}
                  viewCount={video.viewCount.toLocaleString()}
                />
              </div>
              <VideoInformation
                description={video.description}
                performers={performersList}
                tags={tagsList}
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
