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
import { IconPlus, IconEdit, IconTrash, IconEye } from "@tabler/icons-react"

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, email: true } },
      category: { select: { name: true } },
    },
    take: 50,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-500"
      case "DRAFT":
        return "bg-yellow-500"
      case "ARCHIVED":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ARTICLE":
        return "bg-blue-500"
      case "ANNOUNCEMENT":
        return "bg-purple-500"
      case "NEWS":
        return "bg-cyan-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground">Gestiona los artículos del blog</p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <IconPlus className="mr-2 size-4" />
            Nuevo Artículo
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vistas</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay artículos. Crea el primero.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {post.title}
                  </TableCell>
                  <TableCell>{post.author.name || post.author.email}</TableCell>
                  <TableCell>{post.category?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(post.type)}>{post.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                  </TableCell>
                  <TableCell>{post.viewCount.toLocaleString()}</TableCell>
                  <TableCell>
                    {new Date(post.createdAt).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {post.status === "PUBLISHED" && (
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="ghost" size="icon">
                            <IconEye className="size-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/admin/blog/${post.id}`}>
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
  )
}
