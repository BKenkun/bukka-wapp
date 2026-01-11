import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { IconEye, IconCheck, IconX, IconClock } from "@tabler/icons-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SearchParams {
  status?: string
}

export default async function AdminCastingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const statusFilter = params.status || "all"

  const where = statusFilter !== "all" ? { status: statusFilter as "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED" } : {}

  const [submissions, stats] = await Promise.all([
    prisma.castingSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.castingSubmission.groupBy({
      by: ["status"],
      _count: true,
    }),
  ])

  const statusStats = {
    pending: stats.find((s) => s.status === "PENDING")?._count || 0,
    reviewing: stats.find((s) => s.status === "REVIEWING")?._count || 0,
    accepted: stats.find((s) => s.status === "ACCEPTED")?._count || 0,
    rejected: stats.find((s) => s.status === "REJECTED")?._count || 0,
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    REVIEWING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    ACCEPTED: "bg-green-500/20 text-green-400 border-green-500/30",
    REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <IconClock className="size-4" />,
    REVIEWING: <IconEye className="size-4" />,
    ACCEPTED: <IconCheck className="size-4" />,
    REJECTED: <IconX className="size-4" />,
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Solicitudes de Casting</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona las solicitudes de casting recibidas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconClock className="size-4 text-yellow-500" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconEye className="size-4 text-blue-500" />
              En revisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.reviewing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconCheck className="size-4 text-green-500" />
              Aceptadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.accepted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconX className="size-4 text-red-500" />
              Rechazadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusStats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs filter */}
      <Tabs defaultValue={statusFilter} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <Link href="/admin/casting">Todas</Link>
          </TabsTrigger>
          <TabsTrigger value="PENDING" asChild>
            <Link href="/admin/casting?status=PENDING">Pendientes</Link>
          </TabsTrigger>
          <TabsTrigger value="REVIEWING" asChild>
            <Link href="/admin/casting?status=REVIEWING">En revisión</Link>
          </TabsTrigger>
          <TabsTrigger value="ACCEPTED" asChild>
            <Link href="/admin/casting?status=ACCEPTED">Aceptadas</Link>
          </TabsTrigger>
          <TabsTrigger value="REJECTED" asChild>
            <Link href="/admin/casting?status=REJECTED">Rechazadas</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay solicitudes
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.name}
                        </TableCell>
                        <TableCell>{submission.email}</TableCell>
                        <TableCell>
                          {submission.city && submission.country
                            ? `${submission.city}, ${submission.country}`
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(submission.createdAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[submission.status]}>
                            {statusIcons[submission.status]}
                            <span className="ml-1">{submission.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/casting/${submission.id}`}>
                              <IconEye className="mr-2 size-4" />
                              Ver detalles
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
