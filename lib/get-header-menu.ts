import { prisma } from "@/lib/prisma"
import type { NavItemWithMegamenu, MegamenuData, MegamenuPerformer, MegamenuVideo, MegamenuLinkResolved, MegamenuLink } from "@/types/megamenu"

interface GetHeaderMenuOptions {
  userTierLevel: number | null
}

const DEFAULT_NAV_LINKS: NavItemWithMegamenu[] = [
  { id: "default-1", label: "Vídeos", url: "/videos", hasMegamenu: false },
  { id: "default-2", label: "Modelos", url: "/modelos", hasMegamenu: false },
  { id: "default-3", label: "Categorías", url: "#", hasMegamenu: false },
  { id: "default-4", label: "Shop Live", url: "/tienda", hasMegamenu: false },
  { id: "default-5", label: "Casting", url: "/casting", hasMegamenu: false },
  { id: "default-6", label: "Blog", url: "/blog", hasMegamenu: false },
]

export async function getHeaderMenu({ userTierLevel }: GetHeaderMenuOptions): Promise<NavItemWithMegamenu[]> {
  try {
    const menu = await prisma.menu.findUnique({
      where: { slug: "header-main" },
      include: {
        items: {
          where: { isVisible: true, parentId: null },
          orderBy: { order: "asc" },
          include: {
            megamenuConfig: true,
          },
        },
      },
    })

    if (!menu || menu.items.length === 0) {
      return DEFAULT_NAV_LINKS
    }

    // Filter items by subscription level
    const filteredItems = menu.items.filter((item) => {
      if (item.minTierLevel === null) return true
      if (userTierLevel === null) return false
      return userTierLevel >= item.minTierLevel
    })

    if (filteredItems.length === 0) {
      return DEFAULT_NAV_LINKS
    }

    // Process items and hydrate megamenu data
    const itemsWithMegamenu: NavItemWithMegamenu[] = await Promise.all(
      filteredItems.map(async (item): Promise<NavItemWithMegamenu> => {
        // Resolve page URL if needed
        let url = item.url || "#"
        if (item.pageId) {
          const page = await prisma.page.findUnique({
            where: { id: item.pageId, status: "PUBLISHED" },
            select: { slug: true },
          })
          url = page ? `/p/${page.slug}` : "#"
        }

        // If item has megamenu, hydrate the data
        let megamenu: MegamenuData | null = null
        if (item.hasMegamenu && item.megamenuConfig) {
          megamenu = await hydrateMegamenuData(item.megamenuConfig)
        }

        return {
          id: item.id,
          label: item.label,
          url,
          openInNewTab: item.openInNewTab,
          highlight: item.highlight,
          highlightColor: item.highlightColor,
          hasMegamenu: item.hasMegamenu,
          megamenu,
        }
      })
    )

    return itemsWithMegamenu
  } catch (error) {
    console.error("Error fetching header menu:", error)
    return DEFAULT_NAV_LINKS
  }
}

async function hydrateMegamenuData(config: {
  featuredPerformerIds: string[]
  videoSource: string
  videoIds: string[]
  videoCategoryId: string | null
  links: unknown
  linksSectionTitle: string
}): Promise<MegamenuData> {
  // Fetch performers
  const performers: MegamenuPerformer[] = config.featuredPerformerIds.length > 0
    ? await prisma.performer.findMany({
        where: { id: { in: config.featuredPerformerIds } },
        select: {
          id: true,
          slug: true,
          name: true,
          profileImage: true,
        },
      })
    : []

  // Sort performers by the order in featuredPerformerIds
  const sortedPerformers = config.featuredPerformerIds
    .map(id => performers.find(p => p.id === id))
    .filter((p): p is MegamenuPerformer => p !== undefined)

  // Fetch videos based on source type
  let videos: MegamenuVideo[] = []

  switch (config.videoSource) {
    case "MANUAL":
      if (config.videoIds.length > 0) {
        const fetchedVideos = await prisma.video.findMany({
          where: {
            id: { in: config.videoIds },
            status: "PUBLISHED",
          },
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
          },
          take: 4,
        })
        // Sort by the order in videoIds
        videos = config.videoIds
          .map(id => fetchedVideos.find(v => v.id === id))
          .filter((v): v is MegamenuVideo => v !== undefined)
      }
      break

    case "CATEGORY":
      if (config.videoCategoryId) {
        videos = await prisma.video.findMany({
          where: {
            status: "PUBLISHED",
            categories: {
              some: { categoryId: config.videoCategoryId },
            },
          },
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
          },
          orderBy: { releaseDate: "desc" },
          take: 4,
        })
      }
      break

    case "LATEST":
      videos = await prisma.video.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
        },
        orderBy: { releaseDate: "desc" },
        take: 4,
      })
      break

    case "POPULAR":
      videos = await prisma.video.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
        },
        orderBy: { viewCount: "desc" },
        take: 4,
      })
      break
  }

  // Process links
  const rawLinks = (config.links || []) as MegamenuLink[]
  const links: MegamenuLinkResolved[] = await Promise.all(
    rawLinks.map(async (link): Promise<MegamenuLinkResolved> => {
      let url = link.url || "#"
      if (link.categoryId) {
        const category = await prisma.videoCategory.findUnique({
          where: { id: link.categoryId },
          select: { slug: true },
        })
        url = category ? `/videos/${category.slug}` : "#"
      } else if (link.pageId) {
        const page = await prisma.page.findUnique({
          where: { id: link.pageId, status: "PUBLISHED" },
          select: { slug: true },
        })
        url = page ? `/p/${page.slug}` : "#"
      }
      return {
        id: link.id,
        label: link.label,
        url,
        openInNewTab: link.openInNewTab,
      }
    })
  )

  return {
    performers: sortedPerformers,
    videos,
    links,
    linksSectionTitle: config.linksSectionTitle || "Descubre",
  }
}
