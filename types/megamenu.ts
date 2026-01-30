import type { VideoSourceType } from "@prisma/client"

export interface MegamenuLink {
  id: string
  label: string
  url?: string
  pageId?: string
  categoryId?: string
  systemCollectionSlug?: string
  openInNewTab: boolean
}

export interface MegamenuConfigData {
  id: string
  menuItemId: string
  featuredPerformerIds: string[]
  videoSource: VideoSourceType
  videoIds: string[]
  videoCategoryId: string | null
  links: MegamenuLink[]
  linksSectionTitle: string
}

export interface MegamenuPerformer {
  id: string
  slug: string
  name: string
  profileImage: string | null
  videoCount?: number
  totalViews?: number
  verified?: boolean
}

export interface MegamenuVideo {
  id: string
  slug: string
  title: string
  thumbnailUrl: string
  duration: number
}

export interface MegamenuLinkResolved {
  id: string
  label: string
  url: string
  openInNewTab: boolean
}

export interface MegamenuData {
  performers: MegamenuPerformer[]
  videos: MegamenuVideo[]
  links: MegamenuLinkResolved[]
  linksSectionTitle: string
}

export interface NavItemWithMegamenu {
  id: string
  label: string
  url: string
  openInNewTab?: boolean
  highlight?: boolean
  highlightColor?: string | null
  hasMegamenu: boolean
  megamenu?: MegamenuData | null
}
