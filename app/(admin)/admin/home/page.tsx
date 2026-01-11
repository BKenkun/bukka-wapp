import { prisma } from "@/lib/prisma"
import { HomeSectionList } from "./home-section-list"
import { IconHome, IconLayoutGrid, IconPhoto, IconVideo, IconUsers, IconBrandCampaignmonitor, IconClock } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sectionTypeConfig = {
  HERO: { label: "Hero", icon: IconPhoto, color: "text-purple-500" },
  VIDEO_GRID: { label: "Grid de Videos", icon: IconVideo, color: "text-blue-500" },
  ACTRESS_GRID: { label: "Grid de Modelos", icon: IconUsers, color: "text-pink-500" },
  CTA_BANNER: { label: "Banner CTA", icon: IconBrandCampaignmonitor, color: "text-orange-500" },
  COUNTDOWN: { label: "Cuenta Atrás", icon: IconClock, color: "text-green-500" },
  CATEGORY_FEATURED: { label: "Categoría Destacada", icon: IconLayoutGrid, color: "text-yellow-500" },
}

export default async function AdminHomePage() {
  const sections = await prisma.homeSection.findMany({
    orderBy: { order: "asc" },
  })

  const enabledCount = sections.filter((s) => s.enabled).length
  const disabledCount = sections.filter((s) => !s.enabled).length

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconHome className="size-5" />
            Configuración de Home
          </h2>
          <p className="text-sm text-muted-foreground">
            Configura las secciones de la página principal
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
          <CardTitle className="text-base">Secciones</CardTitle>
          <p className="text-sm text-muted-foreground">
            Arrastra para reordenar. Haz clic en una sección para editarla.
          </p>
        </CardHeader>
        <CardContent>
          <HomeSectionList
            sections={sections.map((s) => ({
              ...s,
              config: s.config as Record<string, unknown> | null,
            }))}
            typeConfig={sectionTypeConfig}
          />
        </CardContent>
      </Card>
    </div>
  )
}
