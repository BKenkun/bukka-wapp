import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconPlus, IconEdit, IconEye, IconPin, IconLock } from "@tabler/icons-react"

export default async function AdminForumPage() {
  const [categories, posts, stats] = await Promise.all([
    prisma.forumCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { ForumPost: true } },
      },
    }),
    prisma.forumPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true, email: true } },
        ForumCategory: { select: { name: true } },
      },
    }),
    prisma.forumPost.aggregate({
      _count: true,
      _sum: { viewCount: true, replyCount: true },
    }),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Foro</h1>
          <p className="text-muted-foreground">Gestiona categorías y temas del foro</p>
        </div>
        <Link href="/admin/forum/categories">
          <Button variant="outline">
            <IconEdit className="mr-2 size-4" />
            Gestionar Categorías
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Temas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats._count.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Respuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats._sum.replyCount || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Vistas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats._sum.viewCount || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="text-sm">
                {cat.name} ({cat._count.ForumPost})
              </Badge>
            ))}
            {categories.length === 0 && (
              <p className="text-muted-foreground">
                No hay categorías.{" "}
                <Link href="/admin/forum/categories" className="text-primary underline">
                  Crear una
                </Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Temas Recientes</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Vistas</TableHead>
                <TableHead>Respuestas</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay temas en el foro.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-[250px]">
                      <div className="flex items-center gap-2">
                        {post.isPinned && <IconPin className="size-4 text-orange-500" />}
                        {post.isLocked && <IconLock className="size-4 text-gray-500" />}
                        <span className="truncate">{post.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{post.user.name || post.user.email}</TableCell>
                    <TableCell>{post.ForumCategory.name}</TableCell>
                    <TableCell>{post.viewCount.toLocaleString()}</TableCell>
                    <TableCell>{post.replyCount}</TableCell>
                    <TableCell>
                      {new Date(post.createdAt).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/foro/${post.id}`} target="_blank">
                          <Button variant="ghost" size="icon">
                            <IconEye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/forum/posts/${post.id}`}>
                          <Button variant="ghost" size="icon">
                            <IconEdit className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
