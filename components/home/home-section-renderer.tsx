import { HomeSectionType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Hero } from "@/components/hero"
import { SectionHeader } from "@/components/section-header"
import { VideoGrid } from "@/components/video-grid"
import { VideoCarousel } from "@/components/video-carousel"
import { CtaBanner } from "@/components/cta-banner"
import { ActressesCarousel } from "@/components/actresses-carousel"
import { CountdownTimer } from "@/components/countdown-timer"
import { getVideoToken, getVideoPreviewUrl } from "@/lib/mux/client"

interface HomeSection {
  id: string
  type: HomeSectionType
  title: string | null
  enabled: boolean
  order: number
  config: Record<string, unknown> | null
}

interface HomeSectionRendererProps {
  section: HomeSection
}

interface VideoGridConfig {
  source?: string
  categorySlug?: string
  tagSlug?: string
  videoIds?: string[]
  limit?: number
  columns?: 2 | 3 | 4
}

interface ActressGridConfig {
  source?: string
  performerIds?: string[]
  limit?: number
}

interface HeroConfig {
  backgroundImage?: string
  videoUrl?: string
  linkUrl?: string
  linkPageId?: string
  openInNewTab?: boolean
}

interface CtaBannerConfig {
  title?: string
  description?: string
  buttonText?: string
  buttonUrl?: string
  backgroundImage?: string
  videoUrl?: string
  bgSource?: "image" | "uploadedVideo" | "dbVideo"
  dbVideoId?: string
  dbVideoSlug?: string
  dbVideoTitle?: string
  dbVideoThumbnail?: string
  dbVideoMuxPlaybackId?: string
  titleFontFamily?: string
  titleFontSize?: number
  buttonBgColor?: string
  buttonHoverColor?: string
  buttonTextColor?: string
  buttonHoverTextColor?: string
  overlayEnabled?: boolean
  overlayOpacity?: number
  blurEnabled?: boolean
  blurIntensity?: number
  height?: number
  contentPosition?: string
}

interface CountdownConfig {
  targetDate?: string
  title?: string
  subtitle?: string
  backgroundImage?: string
  videoUrl?: string
}

interface Performer {
  name: string
  slug: string
}

interface VideoData {
  id: string
  slug: string
  title: string
  subtitle?: string
  views: string
  likes?: string
  imageUrl: string
  previewUrl?: string
  previewStartTime?: number
  previewEndTime?: number
  isVerified: boolean
  category?: string
  performers?: Performer[]
  publishedAt?: Date | string
}

async function getVideosForSection(config: VideoGridConfig): Promise<VideoData[]> {
  const limit = config.limit || 6

  try {
    let videos: Array<{
      id: string
      slug: string
      title: string
      thumbnailUrl: string
      previewUrl: string | null
      previewStartTime: number
      previewEndTime: number
      muxPlaybackId: string | null
      viewCount: number
      likeCount: number
      releaseDate: Date | null
      performers: Array<{ performer: { name: string; slug: string } }>
      categories: Array<{ category: { name: string } }>
    }>

    const videoSelect = {
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
      performers: { include: { performer: { select: { name: true, slug: true } } } },
      categories: { include: { category: { select: { name: true } } }, take: 1 },
    }

    // Calculate date for weekly filtering
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    switch (config.source) {
      case "popular":
        videos = await prisma.video.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { viewCount: "desc" },
          take: limit,
          select: videoSelect,
        })
        break

      case "popular_weekly":
        // Most viewed in the last 7 days
        videos = await prisma.video.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { publishedAt: { gte: oneWeekAgo } },
              { releaseDate: { gte: oneWeekAgo } },
            ],
          },
          orderBy: { viewCount: "desc" },
          take: limit,
          select: videoSelect,
        })
        // If not enough recent videos, fill with all-time popular
        if (videos.length < limit) {
          const additionalVideos = await prisma.video.findMany({
            where: {
              status: "PUBLISHED",
              id: { notIn: videos.map((v) => v.id) },
            },
            orderBy: { viewCount: "desc" },
            take: limit - videos.length,
            select: videoSelect,
          })
          videos = [...videos, ...additionalVideos]
        }
        break

      case "trending":
        // Trending: Recently published with good engagement
        // Prioritize newer videos with higher view counts
        videos = await prisma.video.findMany({
          where: {
            status: "PUBLISHED",
            publishedAt: { gte: oneWeekAgo },
          },
          orderBy: [
            { viewCount: "desc" },
            { likeCount: "desc" },
          ],
          take: limit,
          select: videoSelect,
        })
        // If not enough trending, fill with recent popular
        if (videos.length < limit) {
          const additionalVideos = await prisma.video.findMany({
            where: {
              status: "PUBLISHED",
              id: { notIn: videos.map((v) => v.id) },
            },
            orderBy: [
              { publishedAt: "desc" },
              { viewCount: "desc" },
            ],
            take: limit - videos.length,
            select: videoSelect,
          })
          videos = [...videos, ...additionalVideos]
        }
        break

      case "category":
        if (config.categorySlug) {
          videos = await prisma.video.findMany({
            where: {
              status: "PUBLISHED",
              categories: {
                some: {
                  category: { slug: config.categorySlug },
                },
              },
            },
            orderBy: { publishedAt: "desc" },
            take: limit,
            select: videoSelect,
          })
        } else {
          videos = []
        }
        break

      case "tag":
        if (config.tagSlug) {
          videos = await prisma.video.findMany({
            where: {
              status: "PUBLISHED",
              tags: {
                some: {
                  tag: { slug: config.tagSlug },
                },
              },
            },
            orderBy: { publishedAt: "desc" },
            take: limit,
            select: videoSelect,
          })
        } else {
          videos = []
        }
        break

      case "manual":
        if (config.videoIds && config.videoIds.length > 0) {
          const fetchedVideos = await prisma.video.findMany({
            where: {
              id: { in: config.videoIds },
              status: "PUBLISHED",
            },
            select: videoSelect,
          })
          // Maintain the order specified in config.videoIds
          videos = config.videoIds
            .map((id: string) => fetchedVideos.find((v) => v.id === id))
            .filter((v): v is NonNullable<typeof v> => v !== undefined)
        } else {
          videos = []
        }
        break

      case "latest":
      default:
        videos = await prisma.video.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: limit,
          select: videoSelect,
        })
        break
    }

    // Transform to VideoGrid format with signed preview URLs
    return Promise.all(
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
          imageUrl: video.thumbnailUrl || "/images/placeholder-video.jpg",
          previewUrl: videoPreviewUrl,
          previewStartTime: video.previewStartTime,
          previewEndTime: video.previewEndTime,
          isVerified: true,
          category: video.categories[0]?.category.name,
          performers: video.performers.map((p) => ({ name: p.performer.name, slug: p.performer.slug })),
          publishedAt: video.releaseDate || undefined,
        }
      })
    )
  } catch (error) {
    console.error("Error fetching videos for section:", error)
    return []
  }
}

interface PerformerData {
  id: string
  slug?: string
  name: string
  imageUrl: string
  videoCount?: number
  totalViews?: number
  verified?: boolean
  comingSoon?: boolean
  comingSoonDate?: string | null
}

async function getPerformersForSection(config: ActressGridConfig): Promise<PerformerData[]> {
  const limit = config.limit || 10

  try {
    let performers: Array<{
      id: string
      slug: string
      name: string
      profileImage: string | null
      verified: boolean
      comingSoon: boolean
      comingSoonDate: Date | null
      _count: { VideoPerformer: number }
      VideoPerformer: Array<{ video: { viewCount: number } }>
    }>

    const performerSelect = {
      id: true,
      slug: true,
      name: true,
      profileImage: true,
      verified: true,
      comingSoon: true,
      comingSoonDate: true,
      _count: { select: { VideoPerformer: true } },
      VideoPerformer: {
        select: {
          video: {
            select: { viewCount: true },
          },
        },
      },
    }

    switch (config.source) {
      case "manual":
        if (config.performerIds && config.performerIds.length > 0) {
          performers = await prisma.performer.findMany({
            where: { id: { in: config.performerIds } },
            select: performerSelect,
          })
        } else {
          performers = []
        }
        break

      case "popular":
      case "featured":
      case "latest":
      default:
        performers = await prisma.performer.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          select: performerSelect,
        })
        break
    }

    // Transform to ActressesGrid format
    return performers.map((performer) => ({
      id: performer.id,
      slug: performer.slug,
      name: performer.name,
      imageUrl: performer.profileImage || "/images/placeholder-performer.jpg",
      videoCount: performer._count.VideoPerformer,
      totalViews: performer.VideoPerformer.reduce((sum, vp) => sum + vp.video.viewCount, 0),
      verified: performer.verified,
      comingSoon: performer.comingSoon,
      comingSoonDate: performer.comingSoonDate?.toISOString() || null,
    }))
  } catch (error) {
    console.error("Error fetching performers for section:", error)
    return []
  }
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

function calculateLikePercentage(likes: number, views: number): string {
  if (views === 0) return "98%"
  const percentage = Math.min(99, Math.max(50, Math.round((likes / views) * 100 + 80)))
  return `${percentage}%`
}

export async function HomeSectionRenderer({ section }: HomeSectionRendererProps) {
  const config = section.config || {}

  switch (section.type) {
    case "HERO": {
      const heroConfig = config as HeroConfig
      let linkUrl = heroConfig.linkUrl

      // If linkPageId is set, resolve the page URL
      if (heroConfig.linkPageId) {
        const page = await prisma.page.findUnique({
          where: { id: heroConfig.linkPageId },
          select: { slug: true },
        })
        if (page) {
          linkUrl = `/${page.slug}`
        }
      }

      return (
        <Hero
          backgroundImage={heroConfig.backgroundImage}
          videoUrl={heroConfig.videoUrl}
          linkUrl={linkUrl}
          openInNewTab={heroConfig.openInNewTab}
        />
      )
    }

    case "VIDEO_GRID": {
      const videoConfig = config as VideoGridConfig
      const videos = await getVideosForSection(videoConfig)

      return (
        <>
          {section.title && <SectionHeader title={section.title} />}
          <VideoCarousel
            videos={videos.length > 0 ? videos : undefined}
          />
        </>
      )
    }

    case "ACTRESS_GRID": {
      const actressConfig = config as ActressGridConfig
      const performers = await getPerformersForSection(actressConfig)

      if (performers.length === 0) return null

      return (
        <>
          {section.title && <SectionHeader title={section.title} />}
          <ActressesCarousel actresses={performers} />
        </>
      )
    }

    case "CTA_BANNER": {
      const ctaConfig = config as CtaBannerConfig

      // Si es vídeo de la BD con Mux, generar URL firmada para reproducción
      let dbVideoUrl: string | undefined
      if (ctaConfig.bgSource === "dbVideo" && ctaConfig.dbVideoMuxPlaybackId) {
        try {
          const token = await getVideoToken(ctaConfig.dbVideoMuxPlaybackId)
          dbVideoUrl = getVideoPreviewUrl(ctaConfig.dbVideoMuxPlaybackId, token, "high")
        } catch (error) {
          console.warn("Failed to generate CTA banner video URL:", error)
        }
      }

      return (
        <CtaBanner
          title={ctaConfig.title || ""}
          description={ctaConfig.description || ""}
          buttonText={ctaConfig.buttonText || "Ver más"}
          buttonUrl={ctaConfig.buttonUrl}
          backgroundImage={ctaConfig.bgSource === "image" || !ctaConfig.bgSource ? ctaConfig.backgroundImage : undefined}
          videoUrl={ctaConfig.bgSource === "uploadedVideo" ? ctaConfig.videoUrl : dbVideoUrl}
          titleFontFamily={ctaConfig.titleFontFamily}
          titleFontSize={ctaConfig.titleFontSize}
          buttonBgColor={ctaConfig.buttonBgColor}
          buttonHoverColor={ctaConfig.buttonHoverColor}
          buttonTextColor={ctaConfig.buttonTextColor}
          buttonHoverTextColor={ctaConfig.buttonHoverTextColor}
          overlayEnabled={ctaConfig.overlayEnabled}
          overlayOpacity={ctaConfig.overlayOpacity}
          blurEnabled={ctaConfig.blurEnabled}
          blurIntensity={ctaConfig.blurIntensity}
          height={ctaConfig.height}
          contentPosition={ctaConfig.contentPosition as any}
        />
      )
    }

    case "COUNTDOWN": {
      const countdownConfig = config as CountdownConfig
      return (
        <CountdownTimer
          targetDate={countdownConfig.targetDate}
          title={countdownConfig.title}
          subtitle={countdownConfig.subtitle}
          backgroundImage={countdownConfig.backgroundImage}
          videoUrl={countdownConfig.videoUrl}
          height={(countdownConfig as Record<string, unknown>).height as number | undefined}
          contentPosition={(countdownConfig as Record<string, unknown>).contentPosition as "center" | undefined}
          overlayOpacity={(countdownConfig as Record<string, unknown>).overlayOpacity as number | undefined}
        />
      )
    }

    case "CATEGORY_FEATURED": {
      const categoryConfig = config as VideoGridConfig
      const videos = await getVideosForSection({
        source: "category",
        categorySlug: categoryConfig.categorySlug,
        limit: categoryConfig.limit || 6,
      })

      return (
        <>
          {section.title && <SectionHeader title={section.title} />}
          <VideoGrid videos={videos.length > 0 ? videos : undefined} />
        </>
      )
    }

    default:
      console.warn(`Unknown section type: ${section.type}`)
      return null
  }
}
