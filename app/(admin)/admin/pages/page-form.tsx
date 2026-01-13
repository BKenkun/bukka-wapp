"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { IconLoader2, IconEye, IconDeviceFloppy, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

const pageSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  content: z.string().min(1, "El contenido es requerido"),
  excerpt: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
})

type PageFormValues = z.infer<typeof pageSchema>

interface Page {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  metaTitle: string | null
  metaDescription: string | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
}

interface PageFormProps {
  page?: Page
}

export function PageForm({ page }: PageFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [content, setContent] = React.useState(page?.content || "")
  const isEditing = !!page

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: page?.title || "",
      slug: page?.slug || "",
      content: page?.content || "",
      excerpt: page?.excerpt || "",
      metaTitle: page?.metaTitle || "",
      metaDescription: page?.metaDescription || "",
      status: page?.status || "DRAFT",
    },
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    form.setValue("title", title)
    if (!isEditing || !form.getValues("slug")) {
      form.setValue("slug", generateSlug(title))
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    form.setValue("content", newContent)
  }

  const onSubmit = async (data: PageFormValues) => {
    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/admin/pages/${page.id}` : "/api/admin/pages"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          content,
          publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar")
      }

      toast.success(isEditing ? "Página actualizada" : "Página creada")
      router.push("/admin/pages")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!page) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar")
      }

      toast.success("Página eliminada")
      router.push("/admin/pages")
      router.refresh()
    } catch (error) {
      toast.error("Error al eliminar la página")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contenido</CardTitle>
              <CardDescription>
                Información principal de la página
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  onChange={handleTitleChange}
                  placeholder="Política de Privacidad"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/</span>
                  <Input
                    id="slug"
                    {...form.register("slug")}
                    placeholder="politica-privacidad"
                  />
                </div>
                {form.formState.errors.slug && (
                  <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Extracto</Label>
                <Textarea
                  id="excerpt"
                  {...form.register("excerpt")}
                  placeholder="Breve descripción de la página..."
                  rows={2}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Contenido *</Label>
                <RichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder="Escribe el contenido de la página..."
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>
                Optimización para motores de búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Título</Label>
                <Input
                  id="metaTitle"
                  {...form.register("metaTitle")}
                  placeholder="Título para SEO (máx. 60 caracteres)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {form.watch("metaTitle")?.length || 0}/60 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Descripción</Label>
                <Textarea
                  id="metaDescription"
                  {...form.register("metaDescription")}
                  placeholder="Descripción para SEO (máx. 160 caracteres)"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {form.watch("metaDescription")?.length || 0}/160 caracteres
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Publicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as "DRAFT" | "PUBLISHED" | "ARCHIVED")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="PUBLISHED">Publicada</SelectItem>
                    <SelectItem value="ARCHIVED">Archivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                  <IconDeviceFloppy className="mr-2 size-4" />
                  {isEditing ? "Guardar cambios" : "Crear página"}
                </Button>

                {isEditing && form.watch("status") === "PUBLISHED" && (
                  <Button type="button" variant="outline" asChild>
                    <a href={`/p/${page.slug}`} target="_blank">
                      <IconEye className="mr-2 size-4" />
                      Ver página
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delete */}
          {isEditing && (
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-500">Zona de Peligro</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={isDeleting}>
                      {isDeleting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                      <IconTrash className="mr-2 size-4" />
                      Eliminar página
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar página?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La página "{page.title}" será eliminada permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  )
}
