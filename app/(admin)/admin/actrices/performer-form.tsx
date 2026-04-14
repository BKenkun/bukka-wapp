"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import {
  IconLoader2,
  IconUpload,
  IconX,
  IconPhoto,
  IconGripVertical,
  IconRosetteDiscountCheck,
  IconClock,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"

const performerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
  coverImage: z.string().optional(),
  location: z.string().optional(),
  verified: z.boolean().optional(),
  comingSoon: z.boolean().optional(),
  comingSoonDate: z.string().optional(),
})

type PerformerFormData = z.infer<typeof performerSchema>

interface GalleryPhoto {
  id?: string
  imageUrl: string
  caption?: string
  order: number
  isNew?: boolean
}

interface PerformerFormProps {
  performer?: {
    id: string
    name: string
    slug: string
    bio: string | null
    profileImage: string | null
    coverImage: string | null
    location: string | null
    verified: boolean
    comingSoon: boolean
    comingSoonDate: string | null
    PerformerPhoto?: {
      id: string
      imageUrl: string
      caption: string | null
      order: number
    }[]
  }
}

export function PerformerForm({ performer }: PerformerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [profileImage, setProfileImage] = React.useState<string>(performer?.profileImage || "")
  const [coverImage, setCoverImage] = React.useState<string>(performer?.coverImage || "")
  const [isUploadingProfile, setIsUploadingProfile] = React.useState(false)
  const [isUploadingCover, setIsUploadingCover] = React.useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = React.useState(false)

  // Gallery state
  const [galleryPhotos, setGalleryPhotos] = React.useState<GalleryPhoto[]>(
    performer?.PerformerPhoto?.map(p => ({
      id: p.id,
      imageUrl: p.imageUrl,
      caption: p.caption || undefined,
      order: p.order,
    })) || []
  )
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)

  const profileInputRef = React.useRef<HTMLInputElement>(null)
  const coverInputRef = React.useRef<HTMLInputElement>(null)
  const galleryInputRef = React.useRef<HTMLInputElement>(null)

  // Local upload function for profile image
  const uploadProfileImage = async (file: File) => {
    setIsUploadingProfile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "performers")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al subir imagen")
      }

      const result = await response.json()
      setProfileImage(result.url)
      setValue("profileImage", result.url)
      toast.success("Foto de perfil subida")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al subir imagen"
      toast.error(message)
    } finally {
      setIsUploadingProfile(false)
    }
  }

  // Local upload function for cover image
  const uploadCoverImage = async (file: File) => {
    setIsUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "performers")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al subir imagen")
      }

      const result = await response.json()
      setCoverImage(result.url)
      setValue("coverImage", result.url)
      toast.success("Imagen de portada subida")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al subir imagen"
      toast.error(message)
    } finally {
      setIsUploadingCover(false)
    }
  }

  // Upload gallery images
  const uploadGalleryImages = async (files: FileList) => {
    setIsUploadingGallery(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "performers")

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Error al subir imagen")
        }

        return response.json()
      })

      const results = await Promise.all(uploadPromises)

      // Add new photos to gallery
      const newPhotos: GalleryPhoto[] = results.map((result, index) => ({
        imageUrl: result.url,
        order: galleryPhotos.length + index,
        isNew: true,
      }))

      setGalleryPhotos(prev => [...prev, ...newPhotos])
      toast.success(`${files.length} imagen(es) subida(s)`)
    } catch (error) {
      toast.error("Error al subir imágenes")
    } finally {
      setIsUploadingGallery(false)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PerformerFormData>({
    resolver: zodResolver(performerSchema),
    defaultValues: {
      name: performer?.name || "",
      slug: performer?.slug || "",
      bio: performer?.bio || "",
      profileImage: performer?.profileImage || "",
      coverImage: performer?.coverImage || "",
      location: performer?.location || "",
      verified: performer?.verified ?? false,
      comingSoon: performer?.comingSoon ?? false,
      comingSoonDate: performer?.comingSoonDate ? new Date(performer.comingSoonDate).toISOString().slice(0, 16) : "",
    },
  })

  const watchVerified = watch("verified")
  const watchComingSoon = watch("comingSoon")

  const watchName = watch("name")

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!performer && watchName) {
      const slug = watchName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setValue("slug", slug)
    }
  }, [watchName, setValue, performer])

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await uploadProfileImage(files[0])
    if (profileInputRef.current) profileInputRef.current.value = ""
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await uploadCoverImage(files[0])
    if (coverInputRef.current) coverInputRef.current.value = ""
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await uploadGalleryImages(files)
    if (galleryInputRef.current) galleryInputRef.current.value = ""
  }

  const handleProfileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    await uploadProfileImage(files[0])
  }

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    await uploadCoverImage(files[0])
  }

  const handleGalleryDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    await uploadGalleryImages(files)
  }

  const preventDefault = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeProfileImage = () => {
    setProfileImage("")
    setValue("profileImage", "")
  }

  const removeCoverImage = () => {
    setCoverImage("")
    setValue("coverImage", "")
  }

  const removeGalleryPhoto = (index: number) => {
    setGalleryPhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index)
      // Reorder remaining photos
      return newPhotos.map((photo, i) => ({ ...photo, order: i }))
    })
  }

  // Drag and drop reordering for gallery
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    setGalleryPhotos(prev => {
      const newPhotos = [...prev]
      const draggedPhoto = newPhotos[draggedIndex]
      newPhotos.splice(draggedIndex, 1)
      newPhotos.splice(index, 0, draggedPhoto)
      // Update order values
      return newPhotos.map((photo, i) => ({ ...photo, order: i }))
    })
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const onSubmit = async (data: PerformerFormData) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...data,
        profileImage: profileImage || null,
        coverImage: coverImage || null,
        verified: data.verified ?? false,
        comingSoon: data.comingSoon ?? false,
        comingSoonDate: data.comingSoon && data.comingSoonDate ? data.comingSoonDate : null,
        galleryPhotos: galleryPhotos.map((photo, index) => ({
          id: photo.id,
          imageUrl: photo.imageUrl,
          caption: photo.caption || null,
          order: index,
        })),
      }

      const url = performer
        ? `/api/performers/${performer.slug}`
        : "/api/performers"

      const response = await fetch(url, {
        method: performer ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar")
      }

      toast.success(performer ? "Actriz actualizada" : "Actriz creada")
      router.push("/admin/actrices")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar la actriz")
    } finally {
      setIsSubmitting(false)
    }
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
              <CardDescription>Nombre y perfil de la actriz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Nombre artístico"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/modelos/</span>
                    <Input
                      id="slug"
                      {...register("slug")}
                      placeholder="nombre-actriz"
                      className="flex-1"
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-sm text-destructive">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  {...register("bio")}
                  placeholder="Descripción de la actriz..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="Los Angeles, California"
                />
                <p className="text-xs text-muted-foreground">
                  Ej: Madrid, España o Los Angeles, California
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Galería de Fotos</CardTitle>
              <CardDescription>
                Sube fotos de la actriz. Arrastra para reordenar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
              />

              {/* Upload area */}
              <div
                onClick={() => galleryInputRef.current?.click()}
                onDrop={handleGalleryDrop}
                onDragOver={preventDefault}
                onDragEnter={preventDefault}
                className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer rounded-lg p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                {isUploadingGallery ? (
                  <>
                    <IconLoader2 className="size-8 animate-spin" />
                    <span className="text-sm">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <IconUpload className="size-8" />
                    <span className="text-sm text-center">
                      Arrastra imágenes aquí o haz clic para seleccionar
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Puedes seleccionar múltiples imágenes
                    </span>
                  </>
                )}
              </div>

              {/* Gallery grid */}
              {galleryPhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryPhotos.map((photo, index) => (
                    <div
                      key={photo.id || `new-${index}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative aspect-square rounded-lg overflow-hidden border group cursor-move ${
                        draggedIndex === index ? "opacity-50" : ""
                      }`}
                    >
                      <Image
                        src={photo.imageUrl}
                        alt={`Foto ${index + 1}`}
                        fill
                        className="object-cover"
                      />

                      {/* Drag handle indicator */}
                      <div className="absolute top-2 left-2 bg-black/60 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconGripVertical className="size-4 text-white" />
                      </div>

                      {/* Order badge */}
                      <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1">
                        <span className="text-xs text-white font-medium">{index + 1}</span>
                      </div>

                      {/* Remove button */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeGalleryPhoto(index)
                        }}
                      >
                        <IconX className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {galleryPhotos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay fotos en la galería
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Image */}
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
              <CardDescription>Imagen principal de la actriz</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileUpload}
                className="hidden"
              />

              {profileImage ? (
                <div className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={profileImage}
                    alt="Foto de perfil"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeProfileImage}
                  >
                    <IconX className="size-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => profileInputRef.current?.click()}
                  onDrop={handleProfileDrop}
                  onDragOver={preventDefault}
                  onDragEnter={preventDefault}
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                  {isUploadingProfile ? (
                    <>
                      <IconLoader2 className="size-8 animate-spin" />
                      <span className="text-sm">Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <IconPhoto className="size-8" />
                      <span className="text-sm text-center px-4">
                        Arrastra una imagen o haz clic para seleccionar
                      </span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>Imagen de Portada</CardTitle>
              <CardDescription>Imagen de fondo del perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />

              {coverImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={coverImage}
                    alt="Imagen de portada"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeCoverImage}
                  >
                    <IconX className="size-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  onDrop={handleCoverDrop}
                  onDragOver={preventDefault}
                  onDragEnter={preventDefault}
                  className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                  {isUploadingCover ? (
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

          {/* Verified Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconRosetteDiscountCheck className="size-5 text-[#00aaff]" />
                Estado de Verificación
              </CardTitle>
              <CardDescription>Marca la actriz como verificada</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onClick={() => setValue("verified", !watchVerified)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  watchVerified
                    ? "border-[#00aaff] bg-[#00aaff]/10"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center ${
                    watchVerified ? "bg-[#00aaff]" : "bg-muted"
                  }`}>
                    <IconRosetteDiscountCheck className={`size-6 ${
                      watchVerified ? "text-white" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {watchVerified ? "Verificada" : "No verificada"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {watchVerified
                        ? "Se muestra el badge de verificación"
                        : "Sin badge de verificación"}
                    </p>
                  </div>
                </div>
                <div className={`size-6 rounded-full border-2 flex items-center justify-center ${
                  watchVerified
                    ? "border-[#00aaff] bg-[#00aaff]"
                    : "border-muted-foreground/50"
                }`}>
                  {watchVerified && (
                    <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconClock className="size-5 text-pink-400" />
                Próximamente
              </CardTitle>
              <CardDescription>Muestra una cuenta atrás en el carrusel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => setValue("comingSoon", !watchComingSoon)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  watchComingSoon
                    ? "border-pink-400 bg-pink-400/10"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center ${
                    watchComingSoon ? "bg-pink-400" : "bg-muted"
                  }`}>
                    <IconClock className={`size-6 ${
                      watchComingSoon ? "text-white" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {watchComingSoon ? "Próximamente activo" : "Desactivado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {watchComingSoon
                        ? "Se muestra cuenta atrás en el carrusel"
                        : "Aparece como tarjeta normal"}
                    </p>
                  </div>
                </div>
                <div className={`size-6 rounded-full border-2 flex items-center justify-center ${
                  watchComingSoon
                    ? "border-pink-400 bg-pink-400"
                    : "border-muted-foreground/50"
                }`}>
                  {watchComingSoon && (
                    <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {watchComingSoon && (
                <div className="space-y-2">
                  <Label htmlFor="comingSoonDate">Fecha de lanzamiento</Label>
                  <Input
                    id="comingSoonDate"
                    type="datetime-local"
                    {...register("comingSoonDate")}
                  />
                  <p className="text-xs text-muted-foreground">
                    La cuenta atrás se mostrará hasta esta fecha
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              {performer ? "Guardar Cambios" : "Crear Actriz"}
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
