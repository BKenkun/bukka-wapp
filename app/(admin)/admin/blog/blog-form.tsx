"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  IconLoader2,
  IconDeviceFloppy,
  IconPhoto,
  IconX,
  IconUpload,
} from "@tabler/icons-react"

const blogFormSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  slug: z.string().min(3, "El slug debe tener al menos 3 caracteres"),
  excerpt: z.string().optional(),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres"),
  featuredImage: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  type: z.enum(["ARTICLE", "ANNOUNCEMENT", "NEWS"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
})

type BlogFormValues = z.infer<typeof blogFormSchema>

interface BlogCategory {
  id: string
  name: string
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  categoryId: string | null
  type: "ARTICLE" | "ANNOUNCEMENT" | "NEWS"
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
}

interface BlogFormProps {
  post?: BlogPost
  categories: BlogCategory[]
}

export function BlogForm({ post, categories }: BlogFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [featuredImage, setFeaturedImage] = React.useState(post?.featuredImage || "")
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      excerpt: post?.excerpt || "",
      content: post?.content || "",
      featuredImage: post?.featuredImage || "",
      categoryId: post?.categoryId || null,
      type: post?.type || "ARTICLE",
      status: post?.status || "DRAFT",
    },
  })

  // Auto-generate slug from title
  const watchTitle = form.watch("title")

  React.useEffect(() => {
    if (!post && watchTitle) {
      const slug = watchTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      form.setValue("slug", slug)
    }
  }, [watchTitle, post, form])

  const uploadFile = async (file: File) => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "blog")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al subir imagen")
      }

      const result = await response.json()
      setFeaturedImage(result.url)
      form.setValue("featuredImage", result.url)
      toast.success("Imagen subida correctamente")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al subir imagen"
      toast.error(message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await uploadFile(files[0])
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    await uploadFile(files[0])
  }

  const preventDefault = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeImage = () => {
    setFeaturedImage("")
    form.setValue("featuredImage", "")
  }

  async function onSubmit(data: BlogFormValues) {
    setIsLoading(true)

    try {
      const url = post ? `/api/blog/${post.id}` : "/api/blog"
      const method = post ? "PATCH" : "POST"

      const payload = {
        ...data,
        categoryId: data.categoryId || null,
        featuredImage: featuredImage || null,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar")
      }

      toast.success(post ? "Artículo actualizado" : "Artículo creado")
      router.push("/admin/blog")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Información del artículo</CardTitle>
                <CardDescription>
                  Título, subtítulo y contenido principal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Título del artículo"
                          className="text-lg font-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="url-del-articulo" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL amigable (se genera automáticamente)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtítulo / Extracto</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Breve descripción o subtítulo del artículo..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Se muestra en las previsualizaciones y tarjetas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Content Editor Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contenido</CardTitle>
                <CardDescription>
                  Editor con soporte para texto enriquecido, imágenes y HTML
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                          placeholder="Escribe el contenido del artículo..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Featured Image Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPhoto className="size-5" />
                  Imagen destacada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {featuredImage ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border">
                    <Image
                      src={featuredImage}
                      alt="Imagen destacada"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <IconX className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={preventDefault}
                    onDragEnter={preventDefault}
                    className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground"
                  >
                    {isUploading ? (
                      <>
                        <IconLoader2 className="size-8 animate-spin" />
                        <span className="text-sm">Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <IconUpload className="size-8" />
                        <span className="text-sm text-center px-4">
                          Arrastra una imagen o haz clic para seleccionar
                        </span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "__none__" ? null : val)}
                        value={field.value || "__none__"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Sin categoría</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ARTICLE">Artículo</SelectItem>
                          <SelectItem value="ANNOUNCEMENT">Anuncio</SelectItem>
                          <SelectItem value="NEWS">Noticia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">Borrador</SelectItem>
                          <SelectItem value="PUBLISHED">Publicado</SelectItem>
                          <SelectItem value="ARCHIVED">Archivado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <IconDeviceFloppy className="mr-2 size-4" />
                    )}
                    {post ? "Guardar Cambios" : "Crear Artículo"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/blog")}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
