import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { IconPlus, IconMenu2, IconSettings, IconExternalLink } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Menús predefinidos del sistema
const SYSTEM_MENUS = [
  {
    slug: "topbar",
    name: "Top Bar",
    description: "Enlaces con iconos en la barra superior (BUKAKERY, GANGLORY, etc.)",
    location: "Top Bar",
  },
  {
    slug: "header-main",
    name: "Menú Principal (Header)",
    description: "Enlaces principales de navegación en el header",
    location: "Header",
  },
  {
    slug: "header-user",
    name: "Menú Usuario (Header)",
    description: "Enlaces del menú de usuario logueado",
    location: "Header",
  },
  {
    slug: "header-guest",
    name: "Menú Invitado (Header)",
    description: "Dropdown que aparece al pasar el ratón sobre el icono de usuario cuando no está logueado",
    location: "Header",
  },
  {
    slug: "footer-col-1",
    name: "Footer - Columna 1 (Servicios)",
    description: "Enlaces de servicios: Cursos, Tienda, Blog, etc.",
    location: "Footer",
  },
  {
    slug: "footer-col-2",
    name: "Footer - Columna 2 (Contacto)",
    description: "Enlaces de contacto y soporte",
    location: "Footer",
  },
  {
    slug: "footer-col-3",
    name: "Footer - Columna 3 (Información)",
    description: "Enlaces informativos: Términos, Privacidad, etc.",
    location: "Footer",
  },
  {
    slug: "footer-col-4",
    name: "Footer - Columna 4 (Facturación)",
    description: "Enlaces de facturación y proveedores de pago",
    location: "Footer",
  },
]

export default async function AdminMenusPage() {
  // Obtener menús existentes de la base de datos
  const existingMenus = await prisma.menu.findMany({
    include: {
      _count: {
        select: { items: true },
      },
    },
  })

  // Crear un mapa para acceso rápido
  const existingMenusMap = new Map(existingMenus.map((m) => [m.slug, m]))

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Menús</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los menús del header y footer
          </p>
        </div>
      </div>

      {/* Top Bar Menu */}
      <div className="mb-8">
        <h3 className="text-md font-medium mb-4 flex items-center gap-2">
          <IconMenu2 className="size-5" />
          Top Bar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SYSTEM_MENUS.filter((m) => m.location === "Top Bar").map((menuDef) => {
            const existingMenu = existingMenusMap.get(menuDef.slug)
            return (
              <Card key={menuDef.slug}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{menuDef.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {menuDef.description}
                      </CardDescription>
                    </div>
                    {existingMenu && (
                      <Badge variant="secondary">
                        {existingMenu._count.items} items
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant={existingMenu ? "outline" : "default"} className="w-full">
                    <Link href={`/admin/menus/${menuDef.slug}`}>
                      <IconSettings className="mr-2 size-4" />
                      {existingMenu ? "Editar menú" : "Configurar menú"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Header Menus */}
      <div className="mb-8">
        <h3 className="text-md font-medium mb-4 flex items-center gap-2">
          <IconMenu2 className="size-5" />
          Menús del Header
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SYSTEM_MENUS.filter((m) => m.location === "Header").map((menuDef) => {
            const existingMenu = existingMenusMap.get(menuDef.slug)
            return (
              <Card key={menuDef.slug}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{menuDef.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {menuDef.description}
                      </CardDescription>
                    </div>
                    {existingMenu && (
                      <Badge variant="secondary">
                        {existingMenu._count.items} items
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant={existingMenu ? "outline" : "default"} className="w-full">
                    <Link href={`/admin/menus/${menuDef.slug}`}>
                      <IconSettings className="mr-2 size-4" />
                      {existingMenu ? "Editar menú" : "Configurar menú"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Footer Menus */}
      <div className="mb-8">
        <h3 className="text-md font-medium mb-4 flex items-center gap-2">
          <IconExternalLink className="size-5" />
          Menús del Footer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEM_MENUS.filter((m) => m.location === "Footer").map((menuDef) => {
            const existingMenu = existingMenusMap.get(menuDef.slug)
            return (
              <Card key={menuDef.slug}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{menuDef.name}</CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        {menuDef.description}
                      </CardDescription>
                    </div>
                    {existingMenu && (
                      <Badge variant="secondary">
                        {existingMenu._count.items}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant={existingMenu ? "outline" : "default"} size="sm" className="w-full">
                    <Link href={`/admin/menus/${menuDef.slug}`}>
                      <IconSettings className="mr-2 size-4" />
                      {existingMenu ? "Editar" : "Configurar"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Top Bar:</strong> Enlaces con iconos personalizados (SVG) que aparecen en la barra superior. Ideal para marcas asociadas como BUKAKERY, GANGLORY, etc.
          </p>
          <p>
            <strong>Menú Principal:</strong> Los enlaces que aparecen en la barra de navegación principal.
          </p>
          <p>
            <strong>Menú Usuario:</strong> Los enlaces que aparecen en el dropdown del usuario logueado.
          </p>
          <p>
            <strong>Menú Invitado:</strong> El dropdown que aparece al pasar el ratón sobre el icono de usuario cuando no está logueado. Incluye iconos destacados arriba (Registrarse, Iniciar Sesión) y enlaces normales abajo.
          </p>
          <p>
            <strong>Footer Columnas:</strong> Cada columna puede tener un título y enlaces personalizado.
          </p>
          <p>
            <strong>Suscripción mínima:</strong> Puedes configurar cada enlace para que solo sea visible por usuarios con cierto nivel de suscripción.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
