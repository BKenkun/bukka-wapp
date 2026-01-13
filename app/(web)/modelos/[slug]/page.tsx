import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DiscountBanner } from "@/components/discount-banner"
import { SectionHeader } from "@/components/section-header"
import { VideoCard } from "@/components/video-card"
import { getVideoToken, getVideoPreviewUrl } from "@/lib/mux/client"
import Image from "next/image"
import Link from "next/link"
import { IconBrandInstagram, IconBrandTwitter, IconBrandTiktok } from "@tabler/icons-react"

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
        take: 6,
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
            },
          },
        },
      },
      Product: {
        where: { status: "ACTIVE" },
        take: 5,
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          images: true,
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

  // Calcular edad si hay fecha de nacimiento
  const age = performer.birthDate
    ? Math.floor((Date.now() - performer.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  // Generate preview URLs for videos with Mux playback IDs
  const videosWithPreviews = await Promise.all(
    performer.VideoPerformer.map(async ({ video }) => {
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

  return (
    <main className="flex-1 flex flex-col bg-black text-white pt-[124px]">
      <div>
        <DiscountBanner />
      </div>

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
                <div className="relative w-full lg:w-[597px] h-[463px] overflow-hidden">
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
                        color: "#FFF",
                        fontFamily: "Montserrat",
                        fontSize: "36px",
                        fontWeight: 700,
                        lineHeight: "40px",
                      }}
                    >
                      {performer.name}
                    </h1>
                    {performer.User?.isVerified && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 21 21" fill="none">
                        <path
                          d="M18.5312 7.12335C18.2219 6.80008 17.9019 6.46697 17.7813 6.17406C17.6697 5.90577 17.6631 5.46107 17.6566 5.03032C17.6443 4.22954 17.6311 3.3221 17.0002 2.69115C16.3692 2.06021 15.4618 2.04708 14.661 2.03477C14.2303 2.02821 13.7856 2.02165 13.5173 1.91006C13.2252 1.78945 12.8913 1.46947 12.568 1.16015C12.0019 0.616175 11.3586 0 10.502 0C9.64547 0 9.00304 0.616175 8.43609 1.16015C8.11282 1.46947 7.77971 1.78945 7.4868 1.91006C7.22015 2.02165 6.77381 2.02821 6.34306 2.03477C5.54228 2.04708 4.63484 2.06021 4.0039 2.69115C3.37295 3.3221 3.36393 4.22954 3.34752 5.03032C3.34095 5.46107 3.33439 5.90577 3.22281 6.17406C3.1022 6.46615 2.78221 6.80008 2.47289 7.12335C1.92892 7.68947 1.31274 8.33272 1.31274 9.1893C1.31274 10.0459 1.92892 10.6883 2.47289 11.2552C2.78221 11.5785 3.1022 11.9116 3.22281 12.2045C3.33439 12.4728 3.34095 12.9175 3.34752 13.3483C3.35982 14.1491 3.37295 15.0565 4.0039 15.6874C4.63484 16.3184 5.54228 16.3315 6.34306 16.3438C6.77381 16.3504 7.21851 16.357 7.4868 16.4685C7.77889 16.5891 8.11282 16.9091 8.43609 17.2184C9.00222 17.7624 9.64547 18.3786 10.502 18.3786C11.3586 18.3786 12.001 17.7624 12.568 17.2184C12.8913 16.9091 13.2244 16.5891 13.5173 16.4685C13.7856 16.357 14.2303 16.3504 14.661 16.3438C15.4618 16.3315 16.3692 16.3184 17.0002 15.6874C17.6311 15.0565 17.6443 14.1491 17.6566 13.3483C17.6631 12.9175 17.6697 12.4728 17.7813 12.2045C17.9019 11.9124 18.2219 11.5785 18.5312 11.2552C19.0752 10.6891 19.6913 10.0459 19.6913 9.1893C19.6913 8.33272 19.0752 7.69029 18.5312 7.12335Z"
                          fill="#00B1DE"
                        />
                        <path
                          d="M14.2426 6.47195C14.1153 6.34208 13.9403 6.26855 13.7571 6.26855C13.5739 6.26855 13.3989 6.34208 13.2716 6.47195L8.96118 10.8758L7.73259 9.64069C7.6053 9.51082 7.43029 9.43729 7.24707 9.43729C7.06385 9.43729 6.88884 9.51082 6.76155 9.64069L6.27641 10.1295C6.14654 10.2568 6.07301 10.4318 6.07301 10.615C6.07301 10.7982 6.14654 10.9732 6.27641 11.1005L8.47561 13.3071C8.6029 13.437 8.77791 13.5105 8.96113 13.5105C9.14435 13.5105 9.31936 13.437 9.44665 13.3071L14.728 8.00073C14.8579 7.87343 14.9314 7.69842 14.9314 7.51521C14.9314 7.33199 14.8579 7.15698 14.728 7.02968L14.2426 6.47195Z"
                          fill="#00B1DE"
                        />
                      </svg>
                    )}
                  </div>
                  <button
                    className="flex items-center"
                    style={{
                      padding: "10px 14px",
                      gap: "14px",
                      background: "#FA4860",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none">
                      <path
                        d="M1.4875 8.07028L7.13438 13.3422C7.36875 13.5609 7.67812 13.6828 8 13.6828C8.32187 13.6828 8.63125 13.5609 8.86563 13.3422L14.5125 8.07028C15.4625 7.18591 16 5.94528 16 4.64841V4.46716C16 2.28278 14.4219 0.420285 12.2688 0.0609095C10.8438 -0.17659 9.39375 0.289035 8.375 1.30778L8 1.68278L7.625 1.30778C6.60625 0.289035 5.15625 -0.17659 3.73125 0.0609095C1.57812 0.420285 0 2.28278 0 4.46716V4.64841C0 5.94528 0.5375 7.18591 1.4875 8.07028Z"
                        fill="white"
                      />
                    </svg>
                    <span
                      style={{
                        color: "#FFF",
                        textAlign: "center",
                        fontFamily: "Montserrat",
                        fontSize: "16px",
                        fontWeight: 500,
                        lineHeight: "normal",
                      }}
                    >
                      Follow
                    </span>
                  </button>
                </div>

                {/* Location & Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {performer.nationality && (
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" fill="none">
                        <path
                          d="M6.74062 15.6C8.34375 13.5938 12 8.73125 12 6C12 2.6875 9.3125 0 6 0C2.6875 0 0 2.6875 0 6C0 8.73125 3.65625 13.5938 5.25938 15.6C5.64375 16.0781 6.35625 16.0781 6.74062 15.6ZM6 4C6.53043 4 7.03914 4.21071 7.41421 4.58579C7.78929 4.96086 8 5.46957 8 6C8 6.53043 7.78929 7.03914 7.41421 7.41421C7.03914 7.78929 6.53043 8 6 8C5.46957 8 4.96086 7.78929 4.58579 7.41421C4.21071 7.03914 4 6.53043 4 6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4Z"
                          fill="#FA4860"
                        />
                      </svg>
                      <span className="text-white font-montserrat text-lg">{performer.nationality}</span>
                    </div>
                  )}
                  {age && (
                    <span className="text-gray-400 font-montserrat text-lg">{age} años</span>
                  )}
                  {performer.height && (
                    <span className="text-gray-400 font-montserrat text-lg">{performer.height} cm</span>
                  )}
                  {performer.measurements && (
                    <span className="text-gray-400 font-montserrat text-lg">{performer.measurements}</span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-white font-montserrat text-2xl font-bold">
                      {performer._count.PerformerPhoto}
                    </div>
                    <div className="text-gray-300 font-montserrat text-sm">Fotos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-montserrat text-2xl font-bold">
                      {performer._count.VideoPerformer}
                    </div>
                    <div className="text-gray-300 font-montserrat text-sm">Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-montserrat text-2xl font-bold">
                      {performer._count.favorites.toLocaleString()}
                    </div>
                    <div className="text-gray-300 font-montserrat text-sm">Seguidores</div>
                  </div>
                </div>

                {/* Social Links */}
                {(performer.instagram || performer.twitter || performer.onlyfans) && (
                  <div className="flex gap-4 mb-6">
                    {performer.instagram && (
                      <a
                        href={`https://instagram.com/${performer.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-pink-500 hover:text-pink-400"
                      >
                        <IconBrandInstagram size={24} />
                        <span className="font-montserrat">@{performer.instagram}</span>
                      </a>
                    )}
                    {performer.twitter && (
                      <a
                        href={`https://twitter.com/${performer.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                      >
                        <IconBrandTwitter size={24} />
                        <span className="font-montserrat">@{performer.twitter}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Biography */}
                {performer.bio && (
                  <div className="mb-6">
                    <h2 className="text-white font-montserrat text-2xl font-bold mb-3">
                      Biografía
                    </h2>
                    <p className="text-white font-montserrat text-base leading-relaxed">
                      {performer.bio}
                    </p>
                  </div>
                )}

                {/* Physical Details */}
                {(performer.hairColor || performer.eyeColor || performer.skinTone) && (
                  <div className="grid grid-cols-3 gap-4">
                    {performer.hairColor && (
                      <div>
                        <span className="text-gray-400 font-montserrat text-sm">Cabello</span>
                        <p className="text-white font-montserrat">{performer.hairColor}</p>
                      </div>
                    )}
                    {performer.eyeColor && (
                      <div>
                        <span className="text-gray-400 font-montserrat text-sm">Ojos</span>
                        <p className="text-white font-montserrat">{performer.eyeColor}</p>
                      </div>
                    )}
                    {performer.skinTone && (
                      <div>
                        <span className="text-gray-400 font-montserrat text-sm">Piel</span>
                        <p className="text-white font-montserrat">{performer.skinTone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      {performer.Product.length > 0 && (
        <div className="px-4 md:px-8 mt-8">
          <div className="w-full">
            <SectionHeader title="PRODUCTOS" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
              {performer.Product.map((product) => (
                <Link
                  key={product.id}
                  href={`/tienda/${product.slug}`}
                  className="relative w-full h-[439px] overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={product.images[0] || "/images/2.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 className="text-white font-montserrat text-xl font-medium mb-2">
                      {product.name}
                    </h3>
                    <p className="text-white font-montserrat text-xl mb-3">
                      {Number(product.price).toFixed(2)} €
                    </p>
                    <button className="text-white font-inter text-base py-2 px-6 bg-[#FA4860]">
                      Añadir al carrito
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
            <SectionHeader title="GALERÍA DE FOTOS" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {performer.PerformerPhoto.map((photo) => (
                <div
                  key={photo.id}
                  className="relative w-full aspect-square overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={photo.imageUrl}
                    alt={photo.caption || `Foto de ${performer.name}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery from old array field (fallback) */}
      {performer.galleryImages && performer.galleryImages.length > 0 && performer.PerformerPhoto.length === 0 && (
        <div className="px-4 md:px-8 mt-8">
          <div className="w-full">
            <SectionHeader title="GALERÍA DE FOTOS" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {performer.galleryImages.slice(0, 6).map((url, i) => (
                <div
                  key={i}
                  className="relative w-full aspect-square overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={url}
                    alt={`Foto ${i + 1} de ${performer.name}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Videos Section */}
      {videosWithPreviews.length > 0 && (
        <div className="px-4 md:px-8 mt-8">
          <div className="w-full">
            <SectionHeader title="VIDEOS DE LA ACTRIZ" />
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
                  isVerified={performer.User?.isVerified || false}
                  slug={video.slug}
                  videoId={video.id}
                  variant="below"
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
