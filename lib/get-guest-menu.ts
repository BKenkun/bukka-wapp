import { prisma } from "@/lib/prisma"

export interface GuestMenuItem {
  id: string
  label: string
  url: string
  icon: string | null
  customIcon: string | null
  highlight: boolean
  highlightColor: string | null
  openInNewTab: boolean
  badge?: string | null
}

export interface GuestMenuData {
  featuredItems: GuestMenuItem[]  // Items with highlight=true (top row with circles)
  listItems: GuestMenuItem[]      // Items with highlight=false (list below)
}

export async function getGuestMenu(): Promise<GuestMenuData | null> {
  try {
    const menu = await prisma.menu.findUnique({
      where: { slug: "header-guest" },
      include: {
        items: {
          where: {
            isVisible: true,
            parentId: null,
          },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!menu || menu.items.length === 0) {
      return null
    }

    const transformedItems: GuestMenuItem[] = await Promise.all(
      menu.items.map(async (item) => {
        // Determine URL
        let url = item.url || "#"
        if (item.pageId) {
          const page = await prisma.page.findUnique({
            where: { id: item.pageId, status: "PUBLISHED" },
            select: { slug: true },
          })
          url = page ? `/p/${page.slug}` : "#"
        }

        return {
          id: item.id,
          label: item.label,
          url,
          icon: item.icon,
          customIcon: item.customIcon,
          highlight: item.highlight,
          highlightColor: item.highlightColor,
          openInNewTab: item.openInNewTab,
        }
      })
    )

    // Split into featured (highlighted) and list items
    const featuredItems = transformedItems.filter((item) => item.highlight)
    const listItems = transformedItems.filter((item) => !item.highlight)

    return {
      featuredItems,
      listItems,
    }
  } catch (error) {
    console.error("Error fetching guest menu:", error)
    return null
  }
}
