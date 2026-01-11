"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import {
  IconUpload,
  IconPhoto,
  IconVideo,
  IconX,
  IconPlus,
  IconLoader2,
  IconCheck,
  IconSelector,
  IconInfoCircle,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useUploadThing } from "@/lib/uploadthing-client"

const videoSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().optional(),
  thumbnailUrl: z.string().url("URL inválida").or(z.literal("")),
  previewUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  minTierPlanId: z.string().nullable(),
  isDiamondExclusive: z.boolean(),
  isLimitedEdition: z.boolean(),
  limitedAccessUntil: z.string().optional(),
  releaseDate: z.string(),
  has720p: z.boolean(),
  has1080p: z.boolean(),
  has4k: z.boolean(),
  allowDownload: z.boolean(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

type VideoFormData = z.infer<typeof videoSchema>

interface Performer {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  level: number
  color: string | null
}

interface VideoFormProps {
  video?: {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnailUrl: string
    previewUrl: string | null
    status: string
    minTierPlanId: string | null
    isDiamondExclusive: boolean
    isLimitedEdition: boolean
    limitedAccessUntil: Date | null
    releaseDate: Date
    has720p: boolean
    has1080p: boolean
    has4k: boolean
    allowDownload: boolean
    metaTitle: string | null
    metaDescription: string | null
    performers: { performer: Performer }[]
    categories: { category: Category }[]
  }
  performers: Performer[]
  categories: Category[]
  subscriptionPlans: SubscriptionPlan[]
}

export function VideoForm({ video, performers, categories, subscriptionPlans }: VideoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedPerformers, setSelectedPerformers] = React.useState<string[]>(
    video?.performers.map((vp) => vp.performer.id) || []
  )
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    video?.categories.map((vc) => vc.category.id) || []
  )
  const [performersOpen, setPerformersOpen] = React.useState(false)
  const [categoriesOpen, setCategoriesOpen] = React.useState(false)
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string>(video?.thumbnailUrl || "")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing("videoThumbnail", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        const url = res[0].ufsUrl
        setValue("thumbnailUrl", url)
        setThumbnailPreview(url)
        toast.success("Thumbnail subido correctamente")
      }
    },
    onUploadError: (error) => {
      toast.error(`Error al subir: ${error.message}`)
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: video?.title || "",
      slug: video?.slug || "",
      description: video?.description || "",
      thumbnailUrl: video?.thumbnailUrl || "",
      previewUrl: video?.previewUrl || "",
      status: (video?.status as VideoFormData["status"]) || "DRAFT",
      minTierPlanId: video?.minTierPlanId || null,
      isDiamondExclusive: video?.isDiamondExclusive || false,
      isLimitedEdition: video?.isLimitedEdition || false,
      limitedAccessUntil: video?.limitedAccessUntil
        ? new Date(video.limitedAccessUntil).toISOString().split("T")[0]
        : "",
      releaseDate: video?.releaseDate
        ? new Date(video.releaseDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      has720p: video?.has720p ?? true,
      has1080p: video?.has1080p ?? true,
      has4k: video?.has4k ?? false,
      allowDownload: video?.allowDownload ?? false,
      metaTitle: video?.metaTitle || "",
      metaDescription: video?.metaDescription || "",
    },
  })

  const watchTitle = watch("title")
  const watchIsDiamondExclusive = watch("isDiamondExclusive")
  const watchIsLimitedEdition = watch("isLimitedEdition")
  const watchThumbnailUrl = watch("thumbnailUrl")

  // Auto-generate slug from title
  React.useEffect(() => {
    if (!video && watchTitle) {
      const slug = watchTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setValue("slug", slug)
    }
  }, [watchTitle, setValue, video])

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await startUpload(Array.from(files))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (data: VideoFormData) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...data,
        performerIds: selectedPerformers,
        categoryIds: selectedCategories,
      }

      const url = video
        ? `/api/videos/${video.slug}`
        : "/api/videos"

      const response = await fetch(url, {
        method: video ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar")
      }

      toast.success(video ? "Video actualizado" : "Video creado")
      router.push("/admin/videos")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el video")
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePerformer = (id: string) => {
    setSelectedPerformers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const getSelectedPerformerNames = () => {
    return selectedPerformers
      .map((id) => performers.find((p) => p.id === id)?.name)
      .filter(Boolean)
  }

  const getSelectedCategoryNames = () => {
    return selectedCategories
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter(Boolean)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Título, descripción y slug del video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Título del video"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/videos/</span>
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="mi-video"
                    className="flex-1"
                  />
                </div>
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Descripción del video..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Thumbnail y preview del video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label>Thumbnail *</Label>
                <div className="flex gap-4">
                  {/* Preview */}
                  <div className="relative w-48 aspect-video bg-muted rounded-lg overflow-hidden border">
                    {(thumbnailPreview || watchThumbnailUrl) ? (
                      <Image
                        src={thumbnailPreview || watchThumbnailUrl}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <IconPhoto className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <IconUpload className="mr-2 size-4" />
                          Subir Thumbnail
                        </>
                      )}
                    </Button>

                    <div className="text-xs text-muted-foreground">
                      O introduce una URL directamente:
                    </div>

                    <Input
                      {...register("thumbnailUrl")}
                      placeholder="https://..."
                      onChange={(e) => {
                        register("thumbnailUrl").onChange(e)
                        setThumbnailPreview(e.target.value)
                      }}
                    />
                  </div>
                </div>
                {errors.thumbnailUrl && (
                  <p className="text-sm text-destructive">{errors.thumbnailUrl.message}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="previewUrl">URL del Preview (opcional)</Label>
                <Input
                  id="previewUrl"
                  {...register("previewUrl")}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  GIF o video corto que se muestra al hacer hover
                </p>
              </div>

              <div className="p-4 border-2 border-dashed rounded-lg text-center">
                <IconVideo className="size-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  El video se sube directamente a Mux
                </p>
                <Button variant="outline" size="sm" className="mt-2" type="button">
                  Subir Video a Mux
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actrices - Multi-select Combobox */}
          <Card>
            <CardHeader>
              <CardTitle>Actrices</CardTitle>
              <CardDescription>Selecciona las actrices que aparecen en el video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover open={performersOpen} onOpenChange={setPerformersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={performersOpen}
                    className="w-full justify-between h-10"
                  >
                    {selectedPerformers.length > 0
                      ? `${selectedPerformers.length} actriz/actrices seleccionada(s)`
                      : "Seleccionar actrices..."}
                    <IconSelector className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar actriz..." className="h-10" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No se encontraron actrices.</CommandEmpty>
                      <CommandGroup>
                        {performers.map((performer) => (
                          <CommandItem
                            key={performer.id}
                            value={performer.name}
                            onSelect={() => togglePerformer(performer.id)}
                            className="cursor-pointer"
                          >
                            <IconCheck
                              className={cn(
                                "mr-2 size-4",
                                selectedPerformers.includes(performer.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {performer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected performers badges */}
              {selectedPerformers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {getSelectedPerformerNames().map((name, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => {
                        const performer = performers.find((p) => p.name === name)
                        if (performer) togglePerformer(performer.id)
                      }}
                    >
                      {name}
                      <IconX className="ml-1 size-3" />
                    </Badge>
                  ))}
                </div>
              )}

              {performers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay actrices disponibles.{" "}
                  <a href="/admin/performers/new" className="text-primary hover:underline">
                    Crear una
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Categories - Multi-select Combobox */}
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>Selecciona las categorías del video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoriesOpen}
                    className="w-full justify-between h-10"
                  >
                    {selectedCategories.length > 0
                      ? `${selectedCategories.length} categoría(s) seleccionada(s)`
                      : "Seleccionar categorías..."}
                    <IconSelector className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar categoría..." className="h-10" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.name}
                            onSelect={() => toggleCategory(category.id)}
                            className="cursor-pointer"
                          >
                            <IconCheck
                              className={cn(
                                "mr-2 size-4",
                                selectedCategories.includes(category.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {category.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected categories badges */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {getSelectedCategoryNames().map((name, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => {
                        const category = categories.find((c) => c.name === name)
                        if (category) toggleCategory(category.id)
                      }}
                    >
                      {name}
                      <IconX className="ml-1 size-3" />
                    </Badge>
                  ))}
                </div>
              )}

              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay categorías disponibles.{" "}
                  <a href="/admin/video-categories" className="text-primary hover:underline">
                    Crear una
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>Optimización para motores de búsqueda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Título</Label>
                <Input
                  id="metaTitle"
                  {...register("metaTitle")}
                  placeholder="Título para SEO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Descripción</Label>
                <Textarea
                  id="metaDescription"
                  {...register("metaDescription")}
                  placeholder="Descripción para SEO..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Publicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  defaultValue={video?.status || "DRAFT"}
                  onValueChange={(value) => setValue("status", value as VideoFormData["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="SCHEDULED">Programado</SelectItem>
                    <SelectItem value="PUBLISHED">Publicado</SelectItem>
                    <SelectItem value="ARCHIVED">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseDate">Fecha de publicación</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  {...register("releaseDate")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card>
            <CardHeader>
              <CardTitle>Control de Acceso</CardTitle>
              <CardDescription>
                Controla qué suscriptores pueden ver este video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tier Mínimo Requerido</Label>
                <Select
                  defaultValue={video?.minTierPlanId || "none"}
                  onValueChange={(value) => setValue("minTierPlanId", value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin restricción (público)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin restricción (público)</SelectItem>
                    {subscriptionPlans
                      .sort((a, b) => a.level - b.level)
                      .map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: plan.color || "#6b7280" }}
                            />
                            {plan.name}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isDiamondExclusive">Exclusivo Diamond</Label>
                  <p className="text-xs text-muted-foreground">
                    Solo para suscriptores Diamond
                  </p>
                </div>
                <Switch
                  id="isDiamondExclusive"
                  checked={watchIsDiamondExclusive}
                  onCheckedChange={(checked) => setValue("isDiamondExclusive", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isLimitedEdition">Edición Limitada</Label>
                  <p className="text-xs text-muted-foreground">
                    Acceso anticipado para Platinum+
                  </p>
                </div>
                <Switch
                  id="isLimitedEdition"
                  checked={watchIsLimitedEdition}
                  onCheckedChange={(checked) => setValue("isLimitedEdition", checked)}
                />
              </div>

              {watchIsLimitedEdition && (
                <div className="space-y-2">
                  <Label htmlFor="limitedAccessUntil">Acceso limitado hasta</Label>
                  <Input
                    id="limitedAccessUntil"
                    type="date"
                    {...register("limitedAccessUntil")}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quality Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Calidad Disponible
                <IconInfoCircle className="size-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Indica qué calidades tiene el video. Mux gestiona el streaming adaptativo automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <strong>Nota:</strong> Estos campos son informativos. La calidad que ve cada usuario
                depende de su tier de suscripción (720p para Free, 1080p para Silver, 4K para Gold+).
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="has720p">720p HD</Label>
                <Switch
                  id="has720p"
                  defaultChecked={video?.has720p ?? true}
                  onCheckedChange={(checked) => setValue("has720p", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="has1080p">1080p Full HD</Label>
                <Switch
                  id="has1080p"
                  defaultChecked={video?.has1080p ?? true}
                  onCheckedChange={(checked) => setValue("has1080p", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="has4k">4K Ultra HD</Label>
                <Switch
                  id="has4k"
                  defaultChecked={video?.has4k ?? false}
                  onCheckedChange={(checked) => setValue("has4k", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowDownload">Permitir descarga</Label>
                  <p className="text-xs text-muted-foreground">
                    Gold+ pueden descargar
                  </p>
                </div>
                <Switch
                  id="allowDownload"
                  defaultChecked={video?.allowDownload ?? false}
                  onCheckedChange={(checked) => setValue("allowDownload", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              {video ? "Guardar Cambios" : "Crear Video"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
