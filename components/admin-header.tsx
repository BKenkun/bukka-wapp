"use client"

import { usePathname } from "next/navigation"
import { IconSearch, IconBell } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/videos": "Videos",
  "/admin/videos/new": "Nuevo Video",
  "/admin/performers": "Performers",
  "/admin/performers/new": "Nueva Performer",
  "/admin/users": "Usuarios",
  "/admin/products": "Productos",
  "/admin/products/new": "Nuevo Producto",
  "/admin/orders": "Pedidos",
  "/admin/subscriptions": "Suscripciones",
  "/admin/payment-gateways": "Pasarelas de Pago",
  "/admin/video-categories": "Categorías de Videos",
  "/admin/shop-categories": "Categorías de Tienda",
  "/admin/banners": "Banners",
  "/admin/blog": "Blog",
  "/admin/forum": "Foro",
  "/admin/promo-codes": "Códigos Promocionales",
  "/admin/casting": "Solicitudes de Casting",
  "/admin/settings": "Configuración",
}

export function AdminHeader() {
  const pathname = usePathname()

  // Get title from exact match or parent path
  let title = pageTitles[pathname]
  if (!title) {
    // Check for dynamic routes
    const segments = pathname.split("/")
    if (segments.length > 3) {
      const parentPath = segments.slice(0, 3).join("/")
      title = pageTitles[parentPath] || "Admin"
    } else {
      title = "Admin"
    }
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 text-foreground" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium text-foreground">{title}</h1>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-64 pl-8 h-9"
            />
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-foreground">
                <IconBell className="size-5 text-foreground" />
                <Badge className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px]">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">Nuevo pedido #1234</span>
                <span className="text-sm text-muted-foreground">Hace 5 minutos</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">Nueva suscripción Gold</span>
                <span className="text-sm text-muted-foreground">Hace 15 minutos</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">Solicitud de casting recibida</span>
                <span className="text-sm text-muted-foreground">Hace 1 hora</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center text-primary">
                Ver todas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Site */}
          <Button variant="outline" size="sm" asChild className="hidden sm:flex text-foreground">
            <a href="/" target="_blank" rel="noopener noreferrer">
              Ver Sitio
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
