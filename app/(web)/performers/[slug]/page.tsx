import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SectionHeader } from "@/components/section-header"
import { PhotoGalleryCarousel } from "@/components/photo-gallery-carousel"
import { VideoCard } from "@/components/video-card"
import { FollowButton } from "@/components/follow-button"
import { getVideoToken, getVideoPreviewUrl } from "@/lib/mux/client"
import Image from "next/image"
import Link from "next/link"

interface ModelDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { slug } = await params

  const performer = await prisma.performer.findUnique({
    where: { slug },
    include: {
      User: { select: { isVerified: true } },
      PerformerPhoto: {
        orderBy: { order: "asc" },
        take: 6,
      },
      VideoPerformer: {
        where: { video: { status: "PUBLISHED" } },
        orderBy: { video: { releaseDate: "desc" } },
        take: 7, // 1 for latest release + 6 for grid
        include: {
          video: {
            select: {
              id: true,
              slug: true,
              title: true,
              thumbnailUrl: true,
              duration: true,
              viewCount: true,
              likeCount: true,
              muxPlaybackId: true,
              previewStartTime: true,
              previewEndTime: true,
              releaseDate: true,
            },
          },
        },
      },
      products: {
        where: {
          product: { status: "ACTIVE" },
        },
        take: 5,
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              price: true,
              images: true,
            },
          },
        },
      },
      _count: {
        select: {
          VideoPerformer: true,
          favorites: true,
          PerformerPhoto: true,
        },
      },
    },
  })

  if (!performer) {
    notFound()
  }

  // Separate latest release from other videos
  const latestRelease = performer.VideoPerformer[0]?.video || null
  const otherVideos = performer.VideoPerformer.slice(1).map(vp => vp.video)

  // Generate preview URLs for videos with Mux playback IDs
  const videosWithPreviews = await Promise.all(
    otherVideos.map(async (video) => {
      let previewUrl: string | undefined = undefined

      if (video.muxPlaybackId) {
        try {
          const token = await getVideoToken(video.muxPlaybackId)
          previewUrl = getVideoPreviewUrl(video.muxPlaybackId, token, "medium")
        } catch (error) {
          console.error(`Error generating preview for video ${video.id}:`, error)
        }
      }

      return {
        ...video,
        previewUrl,
      }
    })
  )

  // Format follower count
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Cover Image */}
      <div className="w-full overflow-hidden">
        <div className="relative w-full h-[448px] flex-shrink-0">
          <Image
            src={performer.coverImage || "/images/img.png"}
            alt={`${performer.name} banner`}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      <div className="px-4 md:px-8 mt-8">
        <div className="w-full">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Model Image */}
              <div className="flex-shrink-0">
                <div className="relative w-full lg:w-[597px] aspect-[9/16] overflow-hidden">
                  <Image
                    src={performer.profileImage || "/images/e.jpg"}
                    alt={`${performer.name} portrait`}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Right: Model Information */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h1
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--global-font)",
                        fontSize: "36px",
                        fontWeight: 700,
                        lineHeight: "40px",
                      }}
                    >
                      {performer.name}
                    </h1>
                    {performer.verified && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-7 h-7 flex-shrink-0"
                      >
                        <path
                          d="M14.0488 5.53954C14.464 5.44421 14.8939 5.62231 15.1201 5.98327L16.114 7.56981C16.1942 7.69788 16.3025 7.80609 16.4305 7.88633L18.0171 8.88028C18.378 9.10642 18.5561 9.53639 18.4608 9.95153L18.0418 11.7762C18.008 11.9235 18.008 12.0765 18.0418 12.2238L18.4608 14.0485C18.5561 14.4637 18.378 14.8936 18.0171 15.1198L16.4305 16.1137C16.3025 16.194 16.1942 16.3022 16.114 16.4302L15.1201 18.0168C14.8939 18.3777 14.464 18.5558 14.0488 18.4605L12.2241 18.0415C12.0768 18.0077 11.9238 18.0077 11.7765 18.0415L9.95181 18.4605C9.53667 18.5558 9.1067 18.3777 8.88057 18.0168L7.88661 16.4302C7.80638 16.3022 7.69816 16.194 7.57009 16.1137L5.98355 15.1198C5.62259 14.8936 5.44449 14.4637 5.53983 14.0485L5.95885 12.2238C5.99267 12.0766 5.99267 11.9235 5.95885 11.7762L5.53983 9.95153C5.44449 9.53639 5.62259 9.10642 5.98355 8.88028L7.57009 7.88633C7.69816 7.80609 7.80638 7.69788 7.88661 7.56981L8.88057 5.98327C9.1067 5.62231 9.53667 5.44421 9.95181 5.53954L11.7765 5.95856C11.9238 5.99239 12.0768 5.99239 12.2241 5.95856L14.0488 5.53954Z"
                          stroke="var(--pc-verified-color, #00aaff)"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M9.51538 12.5362L11.55 14.4846L14.4846 9.51538"
                          stroke="var(--pc-verified-color, #00aaff)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <FollowButton performerId={performer.id} />
                </div>

                {/* Location */}
                {performer.location && (
                  <div className="flex items-center mb-6" style={{ gap: "12px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" fill="none">
                      <path
                        d="M6.74062 15.6C8.34375 13.5938 12 8.73125 12 6C12 2.6875 9.3125 0 6 0C2.6875 0 0 2.6875 0 6C0 8.73125 3.65625 13.5938 5.25938 15.6C5.64375 16.0781 6.35625 16.0781 6.74062 15.6ZM6 4C6.53043 4 7.03914 4.21071 7.41421 4.58579C7.78929 4.96086 8 5.46957 8 6C8 6.53043 7.78929 7.03914 7.41421 7.41421C7.03914 7.78929 6.53043 8 6 8C5.46957 8 4.96086 7.78929 4.58579 7.41421C4.21071 7.03914 4 6.53043 4 6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4Z"
                        fill="var(--brand-color)"
                      />
                    </svg>
                    <span
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--global-font)",
                        fontSize: "18px",
                        fontWeight: 400,
                        lineHeight: "28px",
                      }}
                    >
                      {performer.location}
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-8 mb-6">
                  <div className="text-center">
                    <div
                      style={{
                        color: "var(--text-primary)",
                        textAlign: "center",
                        fontFamily: "var(--global-font)",
                        fontSize: "24px",
                        fontWeight: 700,
                        lineHeight: "normal",
                      }}
                    >
                      {performer._count.PerformerPhoto}
                    </div>
                    <div
                      style={{
                        color: "var(--text-secondary)",
                        textAlign: "center",
                        fontFamily: "var(--global-font)",
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: "normal",
                      }}
                    >
                      Photos
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      style={{
                        color: "var(--text-primary)",
                        textAlign: "center",
                        fontFamily: "var(--global-font)",
                        fontSize: "24px",
                        fontWeight: 700,
                        lineHeight: "normal",
                      }}
                    >
                      {performer._count.VideoPerformer}
                    </div>
                    <div
                      style={{
                        color: "var(--text-secondary)",
                        textAlign: "center",
                        fontFamily: "var(--global-font)",
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: "normal",
                      }}
                    >
                      Videos
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      style={{
                        color: "var(--text-primary)",
                        textAlign: "center",
                        fontFamily: "var(--global-font)",
                        fontSize: "24px",
                        fontWeight: 700,
                        lineHeight: "normal",
                      }}
                    >
                      {formatFollowers(performer._count.favorites)}
                    </div>
                    <div
                      style={{
                        color: "var(--text-secondary)",
                        textAlign: "center",
                        fontFamily: "var(--global-font)",
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: "normal",
                      }}
                    >
                      Followers
                    </div>
                  </div>
                </div>

                {/* Biography */}
                {performer.bio && (
                  <div className="mb-6">
                    <h2
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--global-font)",
                        fontSize: "24px",
                        fontWeight: 700,
                        lineHeight: "32px",
                        marginBottom: "12px",
                      }}
                    >
                      Biography
                    </h2>
                    <p
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--global-font)",
                        fontSize: "16px",
                        fontWeight: 400,
                        lineHeight: "26px",
                      }}
                    >
                      {performer.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      {performer.products.length > 0 && (
        <div className="px-4 md:px-8 mt-8">
          <div className="w-full">
            <SectionHeader title="PRODUCTS" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
              {performer.products.map(({ product }) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="relative w-full aspect-[9/16] overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={product.images[0] || "/images/2.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3
                      style={{
                        color: "#FFFFFF",
                        fontFamily: "var(--global-font)",
                        fontSize: "21.2px",
                        fontWeight: 500,
                        lineHeight: "25.801px",
                        marginBottom: "8px",
                      }}
                    >
                      {product.name}
                    </h3>
                    <p
                      style={{
                        color: "#FFFFFF",
                        fontFamily: "var(--global-font)",
                        fontSize: "21.2px",
                        fontWeight: 400,
                        lineHeight: "25.801px",
                        marginBottom: "12px",
                      }}
                    >
                      {Number(product.price).toFixed(2)} €
                    </p>
                    <button className="btn-primary">
                      Add to Cart
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Section */}
      {performer.PerformerPhoto.length > 0 && (
        <div className="px-4 md:px-8 mt-8">
          <div className="w-full">
            <SectionHeader title="PHOTO GALLERY" />
            <div className="mt-6">
              <PhotoGalleryCarousel
                photos={performer.PerformerPhoto.map((p) => ({ id: p.id, imageUrl: p.imageUrl, caption: p.caption }))}
                performerName={performer.name}
              />
            </div>
          </div>
        </div>
      )}

      {/* Gallery from old array field (fallback) */}
      {performer.galleryImages && performer.galleryImages.length > 0 && performer.PerformerPhoto.length === 0 && (
        <div className="px-4 md:px-8 mt-8">
          <div className="w-full">
            <SectionHeader title="PHOTO GALLERY" />
            <div className="mt-6">
              <PhotoGalleryCarousel
                photos={performer.galleryImages.map((url, i) => ({ id: `gallery-${i}`, imageUrl: url }))}
                performerName={performer.name}
              />
            </div>
          </div>
        </div>
      )}

      {/* Latest Release Section */}
      {latestRelease && (
        <div className="px-4 md:px-8 mt-8">
          <div className="w-full">
            <SectionHeader title="ÚLTIMO LANZAMIENTO" />
            <Link href={`/videos/${latestRelease.slug}`}>
              <div className="relative w-full aspect-[21/9] overflow-hidden mt-6 group cursor-pointer">
                <Image
                  src={latestRelease.thumbnailUrl || "/images/2.jpg"}
                  alt={latestRelease.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="100vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-6 left-6">
                    <h3
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--global-font)",
                        fontSize: "24px",
                        fontWeight: 700,
                        lineHeight: "32px",
                      }}
                    >
                      {latestRelease.title}
                    </h3>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--global-font)",
                        fontSize: "14px",
                        fontWeight: 400,
                        marginTop: "8px",
                      }}
                    >
                      {latestRelease.viewCount.toLocaleString()} views
                    </p>
                  </div>
                </div>
                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Videos Section */}
      {videosWithPreviews.length > 0 && (
        <div className="px-4 md:px-8 mt-8">
          <div className="w-full">
            <SectionHeader title="PERFORMER VIDEOS" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {videosWithPreviews.map((video) => (
                <VideoCard
                  key={video.id}
                  title={video.title}
                  subtitle={performer.name}
                  views={video.viewCount.toLocaleString()}
                  likes={video.likeCount.toLocaleString()}
                  imageUrl={video.thumbnailUrl || "/images/2.jpg"}
                  previewUrl={video.previewUrl}
                  previewStartTime={video.previewStartTime}
                  previewEndTime={video.previewEndTime}
                  isVerified={performer.verified}
                  slug={video.slug}
                  videoId={video.id}
                  variant="below"
                  publishedAt={video.releaseDate || undefined}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-8" />
    </main>
  )
}
