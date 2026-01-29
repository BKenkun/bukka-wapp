import { prisma } from "@/lib/prisma"
import { SystemCollectionType } from "@prisma/client"

export interface SystemCollectionInfo {
  type: SystemCollectionType
  slug: string
  name: string
  description: string | null
}

// Get all enabled system collections
export async function getEnabledSystemCollections(): Promise<SystemCollectionInfo[]> {
  const collections = await prisma.systemCollection.findMany({
    where: { isEnabled: true },
    orderBy: { order: "asc" },
    select: {
      type: true,
      slug: true,
      name: true,
      description: true,
    },
  })
  return collections
}

// Get a system collection by slug
export async function getSystemCollectionBySlug(slug: string) {
  return prisma.systemCollection.findUnique({
    where: { slug },
  })
}

// Check if a slug is a system collection
export async function isSystemCollectionSlug(slug: string): Promise<boolean> {
  const collection = await prisma.systemCollection.findUnique({
    where: { slug },
    select: { isEnabled: true },
  })
  return collection?.isEnabled ?? false
}

// Video select query for consistent data
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
  duration: true,
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
  _count: {
    select: { comments: true },
  },
}

interface GetVideosOptions {
  skip?: number
  take?: number
}

// Get videos for a system collection type
export async function getVideosForSystemCollection(
  type: SystemCollectionType,
  options: GetVideosOptions = {}
) {
  const { skip = 0, take = 24 } = options
  const baseWhere = { status: "PUBLISHED" as const }

  switch (type) {
    case "MAS_VISTOS":
      // Most viewed videos of all time
      return prisma.video.findMany({
        where: baseWhere,
        orderBy: { viewCount: "desc" },
        skip,
        take,
        select: videoSelect,
      })

    case "NUEVOS":
      // Newest videos by release date
      return prisma.video.findMany({
        where: baseWhere,
        orderBy: { releaseDate: "desc" },
        skip,
        take,
        select: videoSelect,
      })

    case "TENDENCIAS": {
      // Most viewed in the last 7 days
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const trendingVideos = await prisma.video.findMany({
        where: {
          ...baseWhere,
          OR: [
            { publishedAt: { gte: oneWeekAgo } },
            { releaseDate: { gte: oneWeekAgo } },
          ],
        },
        orderBy: { viewCount: "desc" },
        skip,
        take,
        select: videoSelect,
      })

      // If not enough trending videos, fill with popular ones
      if (trendingVideos.length < take) {
        const existingIds = trendingVideos.map((v) => v.id)
        const additionalVideos = await prisma.video.findMany({
          where: {
            ...baseWhere,
            id: { notIn: existingIds },
          },
          orderBy: { viewCount: "desc" },
          take: take - trendingVideos.length,
          select: videoSelect,
        })
        return [...trendingVideos, ...additionalVideos]
      }

      return trendingVideos
    }

    case "MEJOR_VALORADOS":
      // Most liked videos
      return prisma.video.findMany({
        where: baseWhere,
        orderBy: { likeCount: "desc" },
        skip,
        take,
        select: videoSelect,
      })

    case "MAS_COMENTADOS":
      // Most commented videos
      return prisma.video.findMany({
        where: baseWhere,
        orderBy: {
          comments: { _count: "desc" },
        },
        skip,
        take,
        select: videoSelect,
      })

    case "RECOMENDADOS": {
      // Combination of views, likes, and recency
      // Using a scoring algorithm: recent + popular + well-liked
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Get videos with good engagement from the last 30 days
      const recentEngaged = await prisma.video.findMany({
        where: {
          ...baseWhere,
          releaseDate: { gte: thirtyDaysAgo },
        },
        orderBy: [{ viewCount: "desc" }, { likeCount: "desc" }],
        skip,
        take,
        select: videoSelect,
      })

      // If not enough, fill with all-time popular
      if (recentEngaged.length < take) {
        const existingIds = recentEngaged.map((v) => v.id)
        const additionalVideos = await prisma.video.findMany({
          where: {
            ...baseWhere,
            id: { notIn: existingIds },
          },
          orderBy: [{ likeCount: "desc" }, { viewCount: "desc" }],
          take: take - recentEngaged.length,
          select: videoSelect,
        })
        return [...recentEngaged, ...additionalVideos]
      }

      return recentEngaged
    }

    default:
      return []
  }
}

// Get count of videos for a system collection (for pagination)
export async function getVideoCountForSystemCollection(
  type: SystemCollectionType
): Promise<number> {
  const baseWhere = { status: "PUBLISHED" as const }

  switch (type) {
    case "TENDENCIAS": {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      return prisma.video.count({
        where: {
          ...baseWhere,
          OR: [
            { publishedAt: { gte: oneWeekAgo } },
            { releaseDate: { gte: oneWeekAgo } },
          ],
        },
      })
    }

    case "RECOMENDADOS": {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return prisma.video.count({
        where: {
          ...baseWhere,
          releaseDate: { gte: thirtyDaysAgo },
        },
      })
    }

    default:
      return prisma.video.count({ where: baseWhere })
  }
}
