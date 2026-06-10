"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { BlogCategoriesManager } from "./blog-categories-manager"
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconSearch,
  IconLoader2,
  IconArticle,
  IconSpeakerphone,
  IconNews,
  IconCalendar,
} from "@tabler/icons-react"

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  featuredImage: string | null
  type: "ARTICLE" | "ANNOUNCEMENT" | "NEWS"
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  viewCount: number
  createdAt: string
  publishedAt: string | null
  author: {
    name: string | null
    email: string
  }
  category: {
    id: string
    name: string
  } | null
}

interface BlogCategory {
  id: string
  name: string
  slug: string
}

const statusConfig = {
  PUBLISHED: { label: "Publicado", class: "bg-green-500" },
  DRAFT: { label: "Borrador", class: "bg-yellow-500" },
  ARCHIVED: { label: "Archivado", class: "bg-gray-500" },
}

const typeConfig = {
  ARTICLE: { label: "Artículo", icon: IconArticle, class: "bg-blue-500" },
  ANNOUNCEMENT: { label: "Anuncio", icon: IconSpeakerphone, class: "bg-purple-500" },
  NEWS: { label: "Noticia", icon: IconNews, class: "bg-cyan-500" },
}

export default function AdminBlogPage() {
  const [posts, setPosts] = React.useState<BlogPost[]>([])
  const [categories, setCategories] = React.useState<BlogCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [postToDelete, setPostToDelete] = React.useState<BlogPost | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/blog"),
        fetch("/api/admin/blog-categories"),
      ])

      if (postsRes.ok) {
        const data = await postsRes.json()
        setPosts(data.posts || [])
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      toast.error("Error al cargar los datos")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!postToDelete) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/blog/${postToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Error al eliminar")
      }

      toast.success("Artículo eliminado")
      setPosts(posts.filter((p) => p.id !== postToDelete.id))
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    } catch (error) {
      toast.error("Error al eliminar el artículo")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || post.status === statusFilter
    const matchesType = !typeFilter || post.type === typeFilter
    const matchesCategory = !categoryFilter || post.category?.id === categoryFilter

    return matchesSearch && matchesStatus && matchesType && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground">
            {posts.length} artículos en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BlogCategoriesManager />
          <Button asChild>
            <Link href="/admin/blog/new">
              <IconPlus className="mr-2 size-4" />
              Nuevo Artículo
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artículos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los estados</SelectItem>
            <SelectItem value="PUBLISHED">Publicado</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="ARCHIVED">Archivado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter || "__all__"} onValueChange={(v) => setTypeFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los tipos</SelectItem>
            <SelectItem value="ARTICLE">Artículo</SelectItem>
            <SelectItem value="ANNOUNCEMENT">Anuncio</SelectItem>
            <SelectItem value="NEWS">Noticia</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter || "__all__"} onValueChange={(v) => setCategoryFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <IconArticle className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay artículos
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              {search || statusFilter || typeFilter || categoryFilter
                ? "No se encontraron artículos con los filtros aplicados."
                : "Crea tu primer artículo para empezar."}
            </p>
            {!search && !statusFilter && !typeFilter && !categoryFilter && (
              <Button asChild>
                <Link href="/admin/blog/new">
                  <IconPlus className="mr-2 size-4" />
                  Crear Primer Artículo
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPosts.map((post) => {
            const TypeIcon = typeConfig[post.type].icon
            return (
              <Card key={post.id} className="overflow-hidden group">
                {/* Featured Image */}
                <div className="relative aspect-video bg-muted">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <IconArticle className="size-12 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className={statusConfig[post.status].class}>
                      {statusConfig[post.status].label}
                    </Badge>
                  </div>

                  {/* Type badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="gap-1">
                      <TypeIcon className="size-3" />
                      {typeConfig[post.type].label}
                    </Badge>
                  </div>

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {post.status === "PUBLISHED" && (
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <IconEye className="size-4" />
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/admin/blog/${post.id}`}>
                        <IconEdit className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPostToDelete(post)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Category */}
                  {post.category && (
                    <p className="text-xs text-primary font-medium mb-1">
                      {post.category.name}
                    </p>
                  )}

                  {/* Title */}
                  <h3 className="font-semibold line-clamp-2 mb-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="px-4 pb-4 pt-0">
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <IconCalendar className="size-3" />
                      {new Date(post.createdAt).toLocaleDateString("es-ES")}
                    </div>
                    <div className="flex items-center gap-1">
                      <IconEye className="size-3" />
                      {post.viewCount.toLocaleString()}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El artículo &quot;{postToDelete?.title}&quot; será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
