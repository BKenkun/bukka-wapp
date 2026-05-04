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
  IconUserStar,
  IconCategory,
  IconReceipt,
  IconFileText,
  IconMenu2,
  IconHome,
  IconHash,
  IconLogout,
  IconMail,
  IconChevronUp,
  IconPalette,
  IconTruck,
  IconFlag,
  IconShare,
} from "@tabler/icons-react"
import { signOut } from "next-auth/react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { hasPermission, type AdminRole, type Permission } from "@/lib/admin-permissions"

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar: string
    adminRole: string | null
  }
}

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType
  permission: Permission
}

// Dashboard
const navDashboard: NavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: IconDashboard,
    permission: "dashboard",
  },
]

// Contenido (Videos, Modelos, Blog, Categorías, Tags)
const navContent: NavItem[] = [
  {
    title: "Vídeos",
    url: "/admin/videos",
    icon: IconVideo,
    permission: "videos",
  },
  {
    title: "Actrices",
    url: "/admin/actrices",
    icon: IconUserStar,
    permission: "performers",
  },
  {
    title: "Categorías",
    url: "/admin/video-categories",
    icon: IconCategory,
    permission: "video_categories",
  },
  {
    title: "Tags",
    url: "/admin/tags",
    icon: IconHash,
    permission: "tags",
  },
  {
    title: "Blog",
    url: "/admin/blog",
    icon: IconNews,
    permission: "blog",
  },
]

// CMS (Páginas, Menús, Banners, Home)
const navCMS: NavItem[] = [
  {
    title: "Secciones Home",
    url: "/admin/home",
    icon: IconHome,
    permission: "home_sections",
  },
  {
    title: "Páginas",
    url: "/admin/pages",
    icon: IconFileText,
    permission: "pages",
  },
  {
    title: "Menús",
    url: "/admin/menus",
    icon: IconMenu2,
    permission: "menus",
  },
]

// Tienda
const navShop: NavItem[] = [
  {
    title: "Secciones Tienda",
    url: "/admin/shop",
    icon: IconShoppingBag,
    permission: "products",
  },
  {
    title: "Productos",
    url: "/admin/products",
    icon: IconShoppingBag,
    permission: "products",
  },
  {
    title: "Categorías",
    url: "/admin/shop-categories",
    icon: IconCategory,
    permission: "shop_categories",
  },
  {
    title: "Atributos",
    url: "/admin/attributes",
    icon: IconPalette,
    permission: "attributes",
  },
  {
    title: "Códigos Promo",
    url: "/admin/promo-codes",
    icon: IconTag,
    permission: "promo_codes",
  },
  {
    title: "Envío",
    url: "/admin/shipping",
    icon: IconTruck,
    permission: "shipping",
  },
  {
    title: "Pedidos",
    url: "/admin/orders",
    icon: IconPackage,
    permission: "orders",
  },
]

// Comunidad
const navCommunity: NavItem[] = [
  {
    title: "Usuarios",
    url: "/admin/users",
    icon: IconUsers,
    permission: "users",
  },
  {
    title: "Foro",
    url: "/admin/forum",
    icon: IconMessage,
    permission: "forum",
  },
  {
    title: "Reportes",
    url: "/admin/reports",
    icon: IconFlag,
    permission: "reports",
  },
]

// Negocio
const navBusiness: NavItem[] = [
  {
    title: "Suscripciones",
    url: "/admin/subscriptions",
    icon: IconReceipt,
    permission: "subscriptions",
  },
  {
    title: "Referidos",
    url: "/admin/referidos",
    icon: IconShare,
    permission: "referrals",
  },
  {
    title: "Casting",
    url: "/admin/casting",
    icon: IconUserCheck,
    permission: "casting",
  },
]

// Configuración
const navSettings: NavItem[] = [
  {
    title: "Configuración",
    url: "/admin/settings",
    icon: IconSettings,
    permission: "settings",
  },
  {
    title: "Contact Messages",
    url: "/admin/contact",
    icon: IconMail,
    permission: "settings",
  },
]

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  const pathname = usePathname()
  const role = user.adminRole as AdminRole | null

  const isActive = (url: string) => {
    if (url === "/admin") return pathname === "/admin"
    return pathname.startsWith(url)
  }

  // Filtrar items según permisos del rol
  const filterByPermission = (items: NavItem[]) =>
    items.filter((item) => hasPermission(role, item.permission))

  const filteredContent = filterByPermission(navContent)
  const filteredCMS = filterByPermission(navCMS)
  const filteredShop = filterByPermission(navShop)
  const filteredCommunity = filterByPermission(navCommunity)
  const filteredBusiness = filterByPermission(navBusiness)
  const filteredSettings = filterByPermission(navSettings)

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
        {/* Dashboard - siempre visible para admins */}
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
        {filteredContent.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Contenido</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredContent.map((item) => (
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
        )}

        {/* CMS */}
        {filteredCMS.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>CMS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCMS.map((item) => (
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
        )}

        {/* Tienda */}
        {filteredShop.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Tienda</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredShop.map((item) => (
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
        )}

        {/* Comunidad */}
        {filteredCommunity.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Comunidad</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCommunity.map((item) => (
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
        )}

        {/* Negocio */}
        {filteredBusiness.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Negocio</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredBusiness.map((item) => (
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
        )}

        {/* Configuración */}
        {filteredSettings.length > 0 && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettings.map((item) => (
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
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full cursor-pointer">
                  <UserAvatar src={user.avatar} name={user.name} />
                  <div className="flex flex-col text-left text-sm leading-tight flex-1">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <IconChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    Ver sitio web
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/admin/login" })}
                  className="text-destructive cursor-pointer"
                >
                  <IconLogout className="mr-2 size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function UserAvatar({ src, name }: { src?: string; name: string }) {
  const [error, setError] = React.useState(false)

  if (!src || error) {
    return (
      <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
        {name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className="size-8 rounded-full object-cover"
      onError={() => setError(true)}
    />
  )
}
