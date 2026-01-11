"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconDashboard,
  IconUsers,
  IconVideo,
  IconShoppingBag,
  IconPackage,
  IconMessage,
  IconNews,
  IconPhoto,
  IconTag,
  IconUserCheck,
  IconSettings,
  IconHelp,
  IconUserStar,
  IconCategory,
  IconReceipt,
  IconFileText,
  IconMenu2,
  IconHome,
  IconHash,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar: string
  }
}

// Dashboard
const navDashboard = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: IconDashboard,
  },
]

// Contenido (Videos, Modelos, Blog, Categorías, Tags)
const navContent = [
  {
    title: "Videos",
    url: "/admin/videos",
    icon: IconVideo,
  },
  {
    title: "Actrices",
    url: "/admin/performers",
    icon: IconUserStar,
  },
  {
    title: "Categorías",
    url: "/admin/video-categories",
    icon: IconCategory,
  },
  {
    title: "Tags",
    url: "/admin/tags",
    icon: IconHash,
  },
  {
    title: "Blog",
    url: "/admin/blog",
    icon: IconNews,
  },
]

// CMS (Páginas, Menús, Banners, Home)
const navCMS = [
  {
    title: "Secciones Home",
    url: "/admin/home",
    icon: IconHome,
  },
  {
    title: "Páginas",
    url: "/admin/pages",
    icon: IconFileText,
  },
  {
    title: "Menús",
    url: "/admin/menus",
    icon: IconMenu2,
  },
  {
    title: "Banners",
    url: "/admin/banners",
    icon: IconPhoto,
  },
]

// Tienda
const navShop = [
  {
    title: "Productos",
    url: "/admin/products",
    icon: IconShoppingBag,
  },
  {
    title: "Categorías",
    url: "/admin/shop-categories",
    icon: IconCategory,
  },
  {
    title: "Pedidos",
    url: "/admin/orders",
    icon: IconPackage,
  },
]

// Comunidad
const navCommunity = [
  {
    title: "Usuarios",
    url: "/admin/users",
    icon: IconUsers,
  },
  {
    title: "Foro",
    url: "/admin/forum",
    icon: IconMessage,
  },
]

// Negocio
const navBusiness = [
  {
    title: "Suscripciones",
    url: "/admin/subscriptions",
    icon: IconReceipt,
  },
  {
    title: "Códigos Promo",
    url: "/admin/promo-codes",
    icon: IconTag,
  },
  {
    title: "Casting",
    url: "/admin/casting",
    icon: IconUserCheck,
  },
]

// Configuración
const navSettings = [
  {
    title: "Configuración",
    url: "/admin/settings",
    icon: IconSettings,
  },
  {
    title: "Ayuda",
    url: "/admin/help",
    icon: IconHelp,
  },
]

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (url === "/admin") return pathname === "/admin"
    return pathname.startsWith(url)
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/admin">
                <div className="flex size-6 items-center justify-center rounded bg-[#FA4860] text-white font-bold text-xs">
                  B
                </div>
                <span className="text-base font-semibold">BUKKAKERY</span>
                <span className="ml-auto text-[10px] bg-[#FA4860] text-white px-1.5 py-0.5 rounded">
                  ADMIN
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navDashboard.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Contenido */}
        <SidebarGroup>
          <SidebarGroupLabel>Contenido</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navContent.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CMS */}
        <SidebarGroup>
          <SidebarGroupLabel>CMS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navCMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tienda */}
        <SidebarGroup>
          <SidebarGroupLabel>Tienda</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navShop.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Comunidad */}
        <SidebarGroup>
          <SidebarGroupLabel>Comunidad</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navCommunity.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Negocio */}
        <SidebarGroup>
          <SidebarGroupLabel>Negocio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navBusiness.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configuración */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navSettings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="flex items-center gap-2 px-1 py-1.5">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="size-8 rounded-full object-cover"
                />
                <div className="flex flex-col text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
