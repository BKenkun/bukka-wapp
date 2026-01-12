"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import MuxPlayer from "@mux/mux-player-react"
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
  IconPlayerPlay,
  IconPlayerPause,
  IconSettings,
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
import { Slider } from "@/components/ui/slider"
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
import * as UpChunk from "@mux/upchunk"

const videoSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().optional(),
  thumbnailUrl: z.string().url("URL inválida").or(z.literal("")),
  previewUrl: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  minTierPlanId: z.string().nullable(),
  isDiamondExclusive: z.boolean(),
  isLimitedEdition: z.boolean(),
  limitedAccessUntil: z.string().optional(),
  releaseDate: z.string(),
  // Preview settings (Mux MP4)
  previewStartTime: z.number().min(0),
  previewEndTime: z.number().min(0),
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

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
}

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  level: number
}

interface VideoFormProps {
  video?: {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnailUrl: string
    previewUrl: string | null
    muxPlaybackId: string | null
    muxAssetId: string | null
    duration: number
    status: string
    minTierPlanId: string | null
    isDiamondExclusive: boolean
    isLimitedEdition: boolean
    limitedAccessUntil: Date | null
    releaseDate: Date
    // Preview settings
    previewStartTime: number
    previewEndTime: number
    metaTitle: string | null
    metaDescription: string | null
    performers: { performer: Performer }[]
    categories: { category: Category }[]
    relatedProducts: { product: Product }[]
  }
  performers: Performer[]
  categories: Category[]
  products: Product[]
  subscriptionPlans: SubscriptionPlan[]
}

export function VideoForm({ video, performers, categories, products, subscriptionPlans }: VideoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedPerformers, setSelectedPerformers] = React.useState<string[]>(
    video?.performers.map((vp) => vp.performer.id) || []
  )
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    video?.categories.map((vc) => vc.category.id) || []
  )
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>(
    video?.relatedProducts?.map((vp) => vp.product.id) || []
  )
  const [performersOpen, setPerformersOpen] = React.useState(false)
  const [categoriesOpen, setCategoriesOpen] = React.useState(false)
  const [productsOpen, setProductsOpen] = React.useState(false)
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string>(video?.thumbnailUrl || "")
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const videoInputRef = React.useRef<HTMLInputElement>(null)

  // Mux video upload state
  const [isVideoUploading, setIsVideoUploading] = React.useState(false)
  const [videoUploadProgress, setVideoUploadProgress] = React.useState(0)
  const [videoUploadId, setVideoUploadId] = React.useState<string | null>(video?.muxUploadId || null)
  const [muxAssetId, setMuxAssetId] = React.useState<string | null>(video?.muxAssetId || null)
  const [muxPlaybackId, setMuxPlaybackId] = React.useState<string | null>(video?.muxPlaybackId || null)
  const [isDraggingVideo, setIsDraggingVideo] = React.useState(false)
  const dragCounterRef = React.useRef(0)
  const [playbackToken, setPlaybackToken] = React.useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false)
  const [customPreviewUrl, setCustomPreviewUrl] = React.useState<string | null>(video?.previewUrl || null)
  const [isUploadingPreview, setIsUploadingPreview] = React.useState(false)
  const previewInputRef = React.useRef<HTMLInputElement>(null)

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

  const { startUpload: startPreviewUpload } = useUploadThing("videoPreview", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        const url = res[0].ufsUrl
        setValue("previewUrl", url)
        setCustomPreviewUrl(url)
        toast.success("Preview personalizado subido correctamente")
      }
      setIsUploadingPreview(false)
    },
    onUploadError: (error) => {
      toast.error(`Error al subir preview: ${error.message}`)
      setIsUploadingPreview(false)
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
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
      // Preview settings (Mux MP4)
      previewStartTime: video?.previewStartTime ?? 0,
      previewEndTime: video?.previewEndTime ?? 5,
      metaTitle: video?.metaTitle || "",
      metaDescription: video?.metaDescription || "",
    },
  })

  const watchTitle = watch("title")
  const watchIsDiamondExclusive = watch("isDiamondExclusive")
  const watchIsLimitedEdition = watch("isLimitedEdition")
  const watchThumbnailUrl = watch("thumbnailUrl")
  const watchPreviewStartTime = watch("previewStartTime")
  const watchPreviewEndTime = watch("previewEndTime")

  // Fetch playback token when muxPlaybackId exists
  React.useEffect(() => {
    const fetchPlaybackToken = async () => {
      if (!video?.slug || !video?.muxPlaybackId) {
        setPlaybackToken(null)
        return
      }

      setIsLoadingPreview(true)
      try {
        const response = await fetch(`/api/videos/${video.slug}/stream`)
        if (response.ok) {
          const data = await response.json()
          setPlaybackToken(data.token)
        } else {
          console.error("Error fetching playback token")
          setPlaybackToken(null)
        }
      } catch (error) {
        console.error("Error fetching playback token:", error)
        setPlaybackToken(null)
      } finally {
        setIsLoadingPreview(false)
      }
    }

    fetchPlaybackToken()
  }, [video?.slug, video?.muxPlaybackId])

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

  // Formatear segundos a tiempo legible (h:mm:ss o m:ss)
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // Handler para cambiar tiempo de inicio
  // Si el nuevo inicio >= fin actual, ajusta el fin automáticamente
  const handleStartTimeChange = React.useCallback((value: number) => {
    const currentEndTime = getValues("previewEndTime")
    setValue("previewStartTime", value)
    // Si el nuevo inicio es >= al fin actual, mover el fin hacia adelante
    if (value >= currentEndTime) {
      const newEndTime = Math.min(value + 5, video?.duration || 30)
      setValue("previewEndTime", newEndTime)
    }
  }, [setValue, getValues, video?.duration])

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await startUpload(Array.from(files))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsUploadingPreview(true)
    await startPreviewUpload(Array.from(files))
    if (previewInputRef.current) {
      previewInputRef.current.value = ""
    }
  }

  const handleRemoveCustomPreview = () => {
    setCustomPreviewUrl(null)
    setValue("previewUrl", "")
    toast.success("Preview personalizado eliminado")
  }

  // Allowed video MIME types
  const allowedVideoTypes = [
    "video/mp4",
    "video/quicktime", // .mov
    "video/x-matroska", // .mkv
    "video/webm",
    "video/avi",
    "video/x-msvideo",
  ]

  const validateVideoFile = (file: File): string | null => {
    // Check file type
    if (!allowedVideoTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|mkv|webm|avi)$/i)) {
      return "Formato no soportado. Usa MP4, MOV, MKV, WebM o AVI"
    }
    // Check file size (10GB max)
    const maxSize = 10 * 1024 * 1024 * 1024 // 10GB
    if (file.size > maxSize) {
      return "El archivo es demasiado grande. Máximo 10GB"
    }
    return null
  }

  const uploadVideoFile = async (file: File) => {
    // Validate file
    const validationError = validateVideoFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsVideoUploading(true)
    setVideoUploadProgress(0)

    try {
      // Get upload URL from our API
      const response = await fetch("/api/admin/videos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video?.id }),
      })

      if (!response.ok) {
        throw new Error("Error al crear upload")
      }

      const { uploadUrl, uploadId } = await response.json()
      setVideoUploadId(uploadId)

      // Use UpChunk for chunked upload
      const upload = UpChunk.createUpload({
        endpoint: uploadUrl,
        file: file,
        chunkSize: 30720, // 30MB chunks
      })

      upload.on("error", (error) => {
        console.error("Upload error:", error)
        toast.error("Error al subir el video")
        setIsVideoUploading(false)
      })

      upload.on("progress", (progress) => {
        setVideoUploadProgress(Math.round(progress.detail))
      })

      upload.on("success", () => {
        toast.success("Video subido correctamente. Procesando...")
        setIsVideoUploading(false)
        setVideoUploadProgress(100)
        // Poll for asset status
        pollUploadStatus(uploadId)
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Error al subir el video")
      setIsVideoUploading(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    await uploadVideoFile(files[0])

    if (videoInputRef.current) {
      videoInputRef.current.value = ""
    }
  }

  // Drag and drop handlers
  const handleVideoDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingVideo(true)
    }
  }

  const handleVideoDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDraggingVideo(false)
    }
  }

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleVideoDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDraggingVideo(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await uploadVideoFile(files[0])
    }
  }

  const pollUploadStatus = async (uploadId: string) => {
    const maxAttempts = 120 // 10 minutes max
    let attempts = 0

    const check = async () => {
      try {
        const response = await fetch(`/api/admin/videos/upload?uploadId=${uploadId}`)
        const data = await response.json()

        // Update assetId when available
        if (data.assetId && !muxAssetId) {
          setMuxAssetId(data.assetId)
        }

        // Check if asset is ready with playbackId
        if (data.assetStatus === "ready" && data.playbackId) {
          setMuxPlaybackId(data.playbackId)
          toast.success("Video listo para reproducir")
          return
        }

        if (data.status === "errored" || data.assetStatus === "errored") {
          toast.error("Error al procesar el video")
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(check, 3000) // Check every 3 seconds
        } else {
          toast.info("El video aún está procesando. Guarda y revisa más tarde.")
        }
      } catch (error) {
        console.error("Error checking upload status:", error)
      }
    }

    check()
  }

  const onSubmit = async (data: VideoFormData) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...data,
        performerIds: selectedPerformers,
        categoryIds: selectedCategories,
        productIds: selectedProducts,
        // Include Mux IDs
        muxUploadId: videoUploadId || video?.muxUploadId || null,
        muxAssetId: muxAssetId || video?.muxAssetId || null,
        muxPlaybackId: muxPlaybackId || video?.muxPlaybackId || null,
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

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const getSelectedPerformerNames = () => {
    return selectedPerformers
      .map((id) => performers.find((p) => p.id === id)?.name)
      .filter(Boolean)
  }

  const getSelectedProductNames = () => {
    return selectedProducts
      .map((id) => products.find((p) => p.id === id)?.name)
      .filter(Boolean)
  }

  const getSelectedCategoryNames = () => {
    return selectedCategories
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter(Boolean)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{video ? "Editar Video" : "Nuevo Video"}</h2>
          <p className="text-sm text-muted-foreground">
            {video ? "Modifica los detalles del video" : "Completa la información del video"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            {video ? "Guardar Cambios" : "Crear Video"}
          </Button>
        </div>
      </div>

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

              {/* Preview Settings - Mux Video */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-2">
                      <IconPlayerPlay className="size-4" />
                      Preview (Video)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sube un trailer personalizado o usa un fragmento del video automático
                    </p>
                  </div>
                  {customPreviewUrl && (
                    <Badge variant="secondary" className="text-green-600">
                      <IconCheck className="size-3 mr-1" />
                      Preview personalizado
                    </Badge>
                  )}
                </div>

                {/* Custom Preview Upload */}
                <div className="space-y-3">
                  <input
                    ref={previewInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handlePreviewUpload}
                    className="hidden"
                  />

                  {customPreviewUrl ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border">
                        <video
                          src={customPreviewUrl}
                          className="w-full h-full object-contain"
                          controls
                          muted
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-600 font-medium">
                          Preview personalizado activo (tiene prioridad)
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveCustomPreview}
                          className="text-red-600 hover:text-red-700"
                        >
                          <IconX className="size-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors",
                        isUploadingPreview
                          ? "border-[#f9495f] bg-[#f9495f]/10"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                      onClick={() => !isUploadingPreview && previewInputRef.current?.click()}
                    >
                      {isUploadingPreview ? (
                        <div className="flex items-center justify-center gap-2 py-2">
                          <IconLoader2 className="size-5 text-[#f9495f] animate-spin" />
                          <span className="text-sm text-muted-foreground">Subiendo preview...</span>
                        </div>
                      ) : (
                        <div className="py-2">
                          <IconUpload className="size-6 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Arrastra o haz clic para subir un trailer/preview personalizado
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            MP4, MOV, WebM (hasta 512MB)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mux Preview (fallback) */}
                {!customPreviewUrl && video?.muxPlaybackId && (
                  <>
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-border"></div>
                      <span className="px-3 text-xs text-muted-foreground">o genera un preview automático</span>
                      <div className="flex-grow border-t border-border"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Preview Display */}
                      <div className="space-y-3">
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border">
                          {isLoadingPreview ? (
                            <div className="flex items-center justify-center h-full">
                              <IconLoader2 className="size-8 text-muted-foreground animate-spin" />
                            </div>
                          ) : playbackToken && video?.muxPlaybackId ? (
                            <MuxPlayer
                              playbackId={video.muxPlaybackId}
                              tokens={{ playback: playbackToken }}
                              muted
                              startTime={watchPreviewStartTime}
                              style={{ width: "100%", height: "100%" }}
                              primaryColor="#FA4860"
                              streamType="on-demand"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                              <IconInfoCircle className="size-8 mb-2" />
                              <span className="text-xs">Error al cargar preview</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center text-xs text-muted-foreground">
                          Duración del preview: {(watchPreviewEndTime - watchPreviewStartTime).toFixed(1)}s
                        </div>
                      </div>

                      {/* Range Slider para seleccionar inicio/fin */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Desde: <span className="font-medium text-foreground">{formatTime(watchPreviewStartTime)}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Hasta: <span className="font-medium text-foreground">{formatTime(watchPreviewEndTime)}</span>
                          </span>
                        </div>
                        <Slider
                          value={[watchPreviewStartTime, watchPreviewEndTime]}
                          min={0}
                          max={video.duration}
                          step={1}
                          onValueChange={([start, end]) => {
                            if (end > start) {
                              setValue("previewStartTime", start)
                              setValue("previewEndTime", end)
                            }
                          }}
                          className="py-2"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>0:00</span>
                          <span>{formatTime(video.duration)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              {/* Video Upload to Mux */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-2">
                      <IconVideo className="size-4" />
                      Archivo de Video
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sube el video directamente a Mux
                    </p>
                  </div>
                  {(muxAssetId || video?.muxAssetId) && (
                    <Badge variant="secondary" className="text-green-600">
                      <IconCheck className="size-3 mr-1" />
                      Subido
                    </Badge>
                  )}
                </div>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />

                <div
                  className={cn(
                    "p-4 border-2 border-dashed rounded-lg text-center transition-all duration-200 cursor-pointer",
                    isDraggingVideo
                      ? "border-[#f9495f] bg-[#f9495f]/10"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                  onDragEnter={handleVideoDragEnter}
                  onDragLeave={handleVideoDragLeave}
                  onDragOver={handleVideoDragOver}
                  onDrop={handleVideoDrop}
                  onClick={() => !isVideoUploading && !muxAssetId && !video?.muxAssetId && videoInputRef.current?.click()}
                >
                  {isVideoUploading ? (
                    <div className="space-y-3">
                      <IconLoader2 className="size-8 mx-auto text-[#f9495f] animate-spin" />
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-[#f9495f] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${videoUploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Subiendo... {videoUploadProgress}%
                      </p>
                    </div>
                  ) : muxAssetId || video?.muxAssetId ? (
                    <div className="space-y-2">
                      <IconCheck className="size-8 mx-auto text-green-500" />
                      <p className="text-sm text-muted-foreground">
                        Video subido correctamente
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Asset ID: {muxAssetId || video?.muxAssetId}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          videoInputRef.current?.click()
                        }}
                      >
                        Reemplazar Video
                      </Button>
                    </div>
                  ) : isDraggingVideo ? (
                    <div className="space-y-2 py-4">
                      <IconVideo className="size-12 mx-auto text-[#f9495f]" />
                      <p className="text-sm font-medium text-[#f9495f]">
                        Suelta el video aquí
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <IconVideo className="size-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Arrastra un video o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP4, MOV, MKV, WebM, AVI (hasta 10GB)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          videoInputRef.current?.click()
                        }}
                      >
                        <IconUpload className="mr-2 size-4" />
                        Seleccionar Video
                      </Button>
                    </div>
                  )}
                </div>
              </div>
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
                          {plan.name}
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

          {/* Actrices - Multi-select Combobox */}
          <Card>
            <CardHeader>
              <CardTitle>Actrices</CardTitle>
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
                      ? `${selectedPerformers.length} seleccionada(s)`
                      : "Seleccionar..."}
                    <IconSelector className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar actriz..." className="h-10" />
                    <CommandList className="max-h-[200px]">
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

              {selectedPerformers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {getSelectedPerformerNames().map((name, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors text-xs"
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
                <p className="text-xs text-muted-foreground">
                  No hay actrices.{" "}
                  <a href="/admin/actrices/new" className="text-primary hover:underline">
                    Crear
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Categories - Multi-select Combobox */}
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
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
                      ? `${selectedCategories.length} seleccionada(s)`
                      : "Seleccionar..."}
                    <IconSelector className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar categoría..." className="h-10" />
                    <CommandList className="max-h-[200px]">
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

              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {getSelectedCategoryNames().map((name, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors text-xs"
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
                <p className="text-xs text-muted-foreground">
                  No hay categorías.{" "}
                  <a href="/admin/video-categories" className="text-primary hover:underline">
                    Crear
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Products - Multi-select with visual grid */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Relacionados</CardTitle>
              <CardDescription>
                Productos utilizados en este video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Products Grid */}
              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {selectedProducts.length} producto(s) seleccionado(s)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProducts.map((productId) => {
                      const product = products.find((p) => p.id === productId)
                      if (!product) return null
                      return (
                        <div
                          key={product.id}
                          className="relative group bg-muted rounded-lg overflow-hidden border hover:border-destructive transition-colors"
                        >
                          <div className="aspect-square relative">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <IconPhoto className="size-8 text-muted-foreground" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleProduct(product.id)}
                              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                            >
                              <IconX className="size-3 text-white" />
                            </button>
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.price.toFixed(2)}€</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Add Product Dropdown */}
              <Popover open={productsOpen} onOpenChange={setProductsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productsOpen}
                    className="w-full justify-between h-10"
                  >
                    <span className="flex items-center gap-2">
                      <IconPlus className="size-4" />
                      Añadir producto
                    </span>
                    <IconSelector className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar producto..." className="h-10" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No se encontraron productos.</CommandEmpty>
                      <CommandGroup>
                        {products
                          .filter((p) => !selectedProducts.includes(p.id))
                          .map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => {
                                toggleProduct(product.id)
                                setProductsOpen(false)
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-3 w-full">
                                {product.images[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                    <IconPhoto className="size-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">{product.price.toFixed(2)}€</p>
                                </div>
                                <IconPlus className="size-4 text-muted-foreground" />
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {products.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay productos.{" "}
                  <a href="/admin/products/new" className="text-primary hover:underline">
                    Crear
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
