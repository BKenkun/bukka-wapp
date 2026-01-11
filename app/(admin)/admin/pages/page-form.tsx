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
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const pageSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  content: z.string().min(1, "El contenido es requerido"),
  excerpt: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  showInFooter: z.boolean(),
  footerColumn: z.number().nullable(),
  footerOrder: z.number(),
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
  showInFooter: boolean
  footerColumn: number | null
  footerOrder: number
}

interface PageFormProps {
  page?: Page
}

export function PageForm({ page }: PageFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
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
      showInFooter: page?.showInFooter || false,
      footerColumn: page?.footerColumn || null,
      footerOrder: page?.footerOrder || 0,
    },
  })

  const showInFooter = form.watch("showInFooter")

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
                  <span className="text-muted-foreground">/p/</span>
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
                <Label htmlFor="content">Contenido *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Puedes usar HTML para dar formato al contenido
                </p>
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="mb-2">
                    <TabsTrigger value="edit">Editar</TabsTrigger>
                    <TabsTrigger value="preview">Vista previa</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit">
                    <Textarea
                      id="content"
                      {...form.register("content")}
                      placeholder="<h2>Título de sección</h2>&#10;<p>Contenido del párrafo...</p>"
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </TabsContent>
                  <TabsContent value="preview">
                    <div
                      className="min-h-[400px] p-4 border rounded-lg bg-background prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: form.watch("content") || "<p class='text-muted-foreground'>Sin contenido</p>" }}
                    />
                  </TabsContent>
                </Tabs>
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

          {/* Footer Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración Footer</CardTitle>
              <CardDescription>
                Mostrar esta página en el footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showInFooter">Mostrar en Footer</Label>
                <Switch
                  id="showInFooter"
                  checked={showInFooter}
                  onCheckedChange={(checked) => form.setValue("showInFooter", checked)}
                />
              </div>

              {showInFooter && (
                <>
                  <div className="space-y-2">
                    <Label>Columna del Footer</Label>
                    <Select
                      value={form.watch("footerColumn")?.toString() || "1"}
                      onValueChange={(value) => form.setValue("footerColumn", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Columna 1 - Legal</SelectItem>
                        <SelectItem value="2">Columna 2 - Soporte</SelectItem>
                        <SelectItem value="3">Columna 3 - Información</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footerOrder">Orden</Label>
                    <Input
                      id="footerOrder"
                      type="number"
                      {...form.register("footerOrder", { valueAsNumber: true })}
                      min={0}
                    />
                  </div>
                </>
              )}
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
