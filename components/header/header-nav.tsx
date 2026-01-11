import type React from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  openInNewTab?: boolean
  highlight?: boolean
  highlightColor?: string | null
}

interface NavItem {
  id?: string
  label: string
  url: string
  openInNewTab?: boolean
  highlight?: boolean
  highlightColor?: string | null
}

// Links por defecto si el menú no está configurado
const DEFAULT_NAV_LINKS: NavItem[] = [
  { label: "Vídeos", url: "/videos" },
  { label: "Modelos", url: "/modelos" },
  { label: "Categorías", url: "#" },
  { label: "Shop Live", url: "/tienda" },
  { label: "Casting", url: "/casting" },
  { label: "Blog", url: "/blog" },
]

function NavLink({ href, children, openInNewTab, highlight, highlightColor }: NavLinkProps) {
  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      className="text-white text-sm xl:text-base font-bold font-['Montserrat'] leading-6 hover:opacity-80 transition-opacity whitespace-nowrap"
      style={highlight && highlightColor ? { color: highlightColor } : undefined}
    >
      {children}
    </Link>
  )
}

async function getHeaderMenuItems(): Promise<NavItem[] | null> {
  try {
    const menu = await prisma.menu.findUnique({
      where: { slug: "header-main" },
      include: {
        items: {
          where: { isVisible: true, parentId: null },
          orderBy: { order: "asc" },
          select: {
            id: true,
            label: true,
            url: true,
            pageId: true,
            openInNewTab: true,
            highlight: true,
            highlightColor: true,
          },
        },
      },
    })

    if (!menu || menu.items.length === 0) {
      return null // Usar defaults
    }

    // Resolver URLs de páginas internas
    const itemsWithUrls: NavItem[] = await Promise.all(
      menu.items.map(async (item): Promise<NavItem> => {
        if (item.pageId) {
          const page = await prisma.page.findUnique({
            where: { id: item.pageId, status: "PUBLISHED" },
            select: { slug: true },
          })
          return {
            id: item.id,
            label: item.label,
            url: page ? `/p/${page.slug}` : item.url || "#",
            openInNewTab: item.openInNewTab,
            highlight: item.highlight,
            highlightColor: item.highlightColor,
          }
        }
        return {
          id: item.id,
          label: item.label,
          url: item.url || "#",
          openInNewTab: item.openInNewTab,
          highlight: item.highlight,
          highlightColor: item.highlightColor,
        }
      })
    )

    return itemsWithUrls
  } catch (error) {
    console.error("Error fetching header menu:", error)
    return null // Usar defaults en caso de error
  }
}

export async function HeaderNav() {
  const menuItems = await getHeaderMenuItems()
  const links = menuItems || DEFAULT_NAV_LINKS

  return (
    <nav className="flex items-center justify-center w-full">
      <div className="flex items-center gap-[45px] flex-wrap justify-center">
        {links.map((link, index) => (
          <NavLink
            key={link.id || index}
            href={link.url}
            openInNewTab={link.openInNewTab}
            highlight={link.highlight}
            highlightColor={link.highlightColor}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
