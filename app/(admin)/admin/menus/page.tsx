import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { IconPlus, IconMenu2, IconSettings, IconExternalLink } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Menús predefinidos del sistema
const SYSTEM_MENUS = [
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
    slug: "footer-col-1",
    name: "Footer - Columna 1 (Legal)",
    description: "Enlaces legales: Términos, Privacidad, etc.",
    location: "Footer",
  },
  {
    slug: "footer-col-2",
    name: "Footer - Columna 2 (Soporte)",
    description: "Enlaces de soporte: FAQ, Contacto, etc.",
    location: "Footer",
  },
  {
    slug: "footer-col-3",
    name: "Footer - Columna 3 (Información)",
    description: "Enlaces informativos: Sobre nosotros, Blog, etc.",
    location: "Footer",
  },
  {
    slug: "footer-social",
    name: "Footer - Redes Sociales",
    description: "Enlaces a redes sociales con iconos",
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
            <strong>Menú Principal:</strong> Los enlaces que aparecen en la barra de navegación principal.
          </p>
          <p>
            <strong>Menú Usuario:</strong> Los enlaces que aparecen en el dropdown del usuario logueado.
          </p>
          <p>
            <strong>Footer Columnas:</strong> Cada columna puede tener un título y enlaces. Usa iconos de Tabler Icons.
          </p>
          <p>
            <strong>Redes Sociales:</strong> Configura los enlaces a tus redes sociales con sus iconos correspondientes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
