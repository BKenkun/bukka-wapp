import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { VideoForm } from "../video-form"
import Link from "next/link"
import { IconArrowLeft, IconEye, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditVideoPage({ params }: Props) {
  const { id } = await params

  const [video, performers, categories, products, subscriptionPlans] = await Promise.all([
    prisma.video.findUnique({
      where: { id },
      include: {
        performers: {
          include: {
            performer: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        relatedProducts: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, price: true, images: true },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            favorites: true,
            watchHistory: true,
          },
        },
      },
    }),
    prisma.performer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.videoCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, price: true, images: true },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
      select: { id: true, name: true, slug: true, level: true },
    }),
  ])

  if (!video) {
    notFound()
  }

  const transformedVideo = {
    ...video,
    relatedProducts: video.relatedProducts.map((rp) => ({
      ...rp,
      product: {
        ...rp.product,
        price: Number(rp.product.price),
      },
    })),
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/videos">
              <IconArrowLeft className="mr-2 size-4" />
              Volver a Videos
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/videos/${video.slug}`} target="_blank">
                <IconEye className="mr-2 size-4" />
                Ver en sitio
              </Link>
            </Button>
            <Button variant="destructive" size="sm">
              <IconTrash className="mr-2 size-4" />
              Eliminar
            </Button>
          </div>
        </div>
        <h2 className="text-lg font-semibold">Editar Video</h2>
        <p className="text-sm text-muted-foreground">
          {video.title}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{video.viewCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Likes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{video.likeCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{video._count.favorites}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comentarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{video._count.comments}</p>
          </CardContent>
        </Card>
      </div>

      <VideoForm
        video={transformedVideo}
        performers={performers}
        categories={categories}
        products={products.map(p => ({ ...p, price: Number(p.price) }))}
        subscriptionPlans={subscriptionPlans}
      />
    </div>
  )
}
