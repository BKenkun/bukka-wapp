import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { IconPlus, IconFile, IconFileText, IconEye, IconPencil, IconCheck, IconClock, IconArchive } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusConfig = {
  DRAFT: { label: "Borrador", icon: IconClock, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  PUBLISHED: { label: "Publicada", icon: IconCheck, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  ARCHIVED: { label: "Archivada", icon: IconArchive, color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
}

export default async function AdminPagesPage() {
  const [pages, stats] = await Promise.all([
    prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
    }),
    prisma.page.groupBy({
      by: ["status"],
      _count: true,
    }),
  ])

  const statusStats = {
    draft: stats.find((s) => s.status === "DRAFT")?._count || 0,
    published: stats.find((s) => s.status === "PUBLISHED")?._count || 0,
    archived: stats.find((s) => s.status === "ARCHIVED")?._count || 0,
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Páginas</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona las páginas estáticas y avisos legales
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pages/new">
            <IconPlus className="mr-2 size-4" />
            Nueva Página
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconClock className="size-4 text-yellow-500" />
              Borradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconCheck className="size-4 text-green-500" />
              Publicadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconArchive className="size-4 text-gray-500" />
              Archivadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.archived}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Footer</TableHead>
                <TableHead>Actualizada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <IconFileText className="size-12 mx-auto mb-4 opacity-20" />
                    <p>No hay páginas creadas</p>
                    <Button asChild variant="link" className="mt-2">
                      <Link href="/admin/pages/new">Crear primera página</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page) => {
                  const status = statusConfig[page.status]
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded bg-muted flex items-center justify-center">
                            <IconFile className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{page.title}</p>
                            {page.metaTitle && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {page.metaTitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          /{page.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="size-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {page.showInFooter ? (
                          <Badge variant="secondary">
                            Columna {page.footerColumn || 1}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(page.updatedAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {page.status === "PUBLISHED" && (
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/p/${page.slug}`} target="_blank">
                                <IconEye className="size-4" />
                              </Link>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/pages/${page.id}`}>
                              <IconPencil className="mr-2 size-4" />
                              Editar
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
