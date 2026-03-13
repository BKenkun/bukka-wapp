import { prisma } from "@/lib/prisma"
import { ShopSectionList } from "./shop-section-list"
import { IconShoppingBag } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminShopPage() {
  const [sections, categories] = await Promise.all([
    prisma.shopSection.findMany({
      orderBy: { order: "asc" },
    }),
    prisma.shopCategory.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, imageUrl: true },
    }),
  ])

  const enabledCount = sections.filter((s) => s.enabled).length
  const disabledCount = sections.filter((s) => !s.enabled).length

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconShoppingBag className="size-5" />
            Configuracion de Tienda
          </h2>
          <p className="text-sm text-muted-foreground">
            Configura las secciones de la pagina /tienda (igual que Inicio)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Secciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sections.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-green-500">
              Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{enabledCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-gray-500">
              Inactivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{disabledCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Secciones de la Tienda</CardTitle>
          <p className="text-sm text-muted-foreground">
            Arrastra para reordenar. Haz clic en Editar para configurar cada seccion.
          </p>
        </CardHeader>
        <CardContent>
          <ShopSectionList
            sections={sections.map((s) => ({
              ...s,
              config: s.config as Record<string, unknown> | null,
            }))}
            categories={categories}
          />
        </CardContent>
      </Card>
    </div>
  )
}
