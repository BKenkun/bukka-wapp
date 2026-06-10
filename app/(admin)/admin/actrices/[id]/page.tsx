import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PerformerForm } from "../performer-form"
import Link from "next/link"
import { IconArrowLeft, IconEye, IconTrash, IconVideo } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPerformerPage({ params }: Props) {
  const { id } = await params

  const performer = await prisma.performer.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          VideoPerformer: true,
          favorites: true,
          products: true,
        },
      },
      User: {
        select: { id: true, name: true, email: true },
      },
      VideoPerformer: {
        take: 5,
        orderBy: { video: { releaseDate: "desc" } },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
              viewCount: true,
            },
          },
        },
      },
      PerformerPhoto: {
        orderBy: { order: "asc" },
        include: {
          tags: {
            include: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
      PerformerTag: {
        include: {
          tag: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  })

  if (!performer) {
    notFound()
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/actrices">
              <IconArrowLeft className="mr-2 size-4" />
              Volver a Actrices
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/modelos/${performer.slug}`} target="_blank">
                <IconEye className="mr-2 size-4" />
                Ver perfil
              </Link>
            </Button>
            <Button variant="destructive" size="sm">
              <IconTrash className="mr-2 size-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Header with avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={performer.profileImage || undefined} alt={performer.name} />
            <AvatarFallback className="text-xl">{performer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{performer.name}</h2>
            <p className="text-sm text-muted-foreground">
              Editando perfil de actriz
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{performer._count.VideoPerformer}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{performer._count.favorites}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{performer._count.products}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performer.verified ? (
              <Badge className="bg-[#00aaff]/10 text-[#00aaff] border-[#00aaff]/20">Verificada</Badge>
            ) : (
              <Badge variant="outline">No verificada</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Videos */}
      {performer.VideoPerformer.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconVideo className="size-5" />
              Videos recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {performer.VideoPerformer.map(({ video }) => (
                <Link
                  key={video.id}
                  href={`/admin/videos/${video.id}`}
                  className="group"
                >
                  <div className="relative aspect-video bg-muted rounded overflow-hidden mb-2">
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{video.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {video.viewCount.toLocaleString()} vistas
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PerformerForm performer={{
        ...performer,
        comingSoonDate: performer.comingSoonDate?.toISOString() ?? null,
        tags: performer.PerformerTag.map((pt) => ({ tag: pt.tag })),
      }} />
    </div>
  )
}
