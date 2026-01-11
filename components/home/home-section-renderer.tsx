import { HomeSectionType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Hero } from "@/components/hero"
import { SectionHeader } from "@/components/section-header"
import { VideoGrid } from "@/components/video-grid"
import { CtaBanner } from "@/components/cta-banner"
import { ActressesGrid } from "@/components/actresses-grid"
import { CountdownTimer } from "@/components/countdown-timer"

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
  videoIds?: string[]
  limit?: number
  columns?: 2 | 3
}

interface ActressGridConfig {
  source?: string
  performerIds?: string[]
  limit?: number
}

interface HeroConfig {
  backgroundImage?: string
  videoId?: string
  linkUrl?: string
}

interface CtaBannerConfig {
  title?: string
  description?: string
  buttonText?: string
  buttonUrl?: string
  backgroundImage?: string
}

interface CountdownConfig {
  targetDate?: string
  title?: string
  subtitle?: string
  backgroundImage?: string
}

interface VideoData {
  id: string
  title: string
  subtitle: string
  views: string
  likes: string
  imageUrl: string
  isVerified: boolean
}

async function getVideosForSection(config: VideoGridConfig): Promise<VideoData[]> {
  const limit = config.limit || 6

  try {
    let videos: Array<{
      id: string
      title: string
      thumbnailUrl: string
      viewCount: number
      likeCount: number
      performers: Array<{ performer: { name: string } }>
    }>

    switch (config.source) {
      case "popular":
        videos = await prisma.video.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { viewCount: "desc" },
          take: limit,
          include: {
            performers: { include: { performer: { select: { name: true } } } },
          },
        })
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
            include: {
              performers: { include: { performer: { select: { name: true } } } },
            },
          })
        } else {
          videos = []
        }
        break

      case "manual":
        if (config.videoIds && config.videoIds.length > 0) {
          videos = await prisma.video.findMany({
            where: {
              id: { in: config.videoIds },
              status: "PUBLISHED",
            },
            include: {
              performers: { include: { performer: { select: { name: true } } } },
            },
          })
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
          include: {
            performers: { include: { performer: { select: { name: true } } } },
          },
        })
        break
    }

    // Transform to VideoGrid format
    return videos.map((video) => ({
      id: video.id,
      title: video.title,
      subtitle: video.performers.map((p) => p.performer.name).join(", ") || "",
      views: formatViews(video.viewCount),
      likes: calculateLikePercentage(video.likeCount, video.viewCount),
      imageUrl: video.thumbnailUrl || "/images/placeholder-video.jpg",
      isVerified: true,
    }))
  } catch (error) {
    console.error("Error fetching videos for section:", error)
    return []
  }
}

interface PerformerData {
  id: string
  name: string
  imageUrl: string
  videoCount?: number
}

async function getPerformersForSection(config: ActressGridConfig): Promise<PerformerData[]> {
  const limit = config.limit || 10

  try {
    let performers: Array<{
      id: string
      name: string
      profileImage: string | null
    }>

    switch (config.source) {
      case "manual":
        if (config.performerIds && config.performerIds.length > 0) {
          performers = await prisma.performer.findMany({
            where: { id: { in: config.performerIds } },
            select: { id: true, name: true, profileImage: true },
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
          select: { id: true, name: true, profileImage: true },
        })
        break
    }

    // Transform to ActressesGrid format
    return performers.map((performer) => ({
      id: performer.id,
      name: performer.name,
      imageUrl: performer.profileImage || "/images/placeholder-performer.jpg",
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
      return (
        <Hero
          backgroundImage={heroConfig.backgroundImage}
          videoId={heroConfig.videoId}
          linkUrl={heroConfig.linkUrl}
        />
      )
    }

    case "VIDEO_GRID": {
      const videoConfig = config as VideoGridConfig
      const videos = await getVideosForSection(videoConfig)

      return (
        <>
          {section.title && <SectionHeader title={section.title} />}
          <VideoGrid
            videos={videos.length > 0 ? videos : undefined}
            columns={videoConfig.columns}
          />
        </>
      )
    }

    case "ACTRESS_GRID": {
      const actressConfig = config as ActressGridConfig
      const performers = await getPerformersForSection(actressConfig)

      return (
        <>
          {section.title && <SectionHeader title={section.title} />}
          <ActressesGrid actresses={performers.length > 0 ? performers : undefined} />
        </>
      )
    }

    case "CTA_BANNER": {
      const ctaConfig = config as CtaBannerConfig
      return (
        <CtaBanner
          title={ctaConfig.title || ""}
          description={ctaConfig.description || ""}
          buttonText={ctaConfig.buttonText || "Ver más"}
          buttonUrl={ctaConfig.buttonUrl}
          backgroundImage={ctaConfig.backgroundImage}
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
