"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import {
  IconLoader2,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandOnlyfans,
  IconUpload,
  IconX,
  IconPhoto,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { useUploadThing } from "@/lib/uploadthing-client"

const performerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
  coverImage: z.string().optional(),
  nationality: z.string().optional(),
  birthDate: z.string().optional(),
  height: z.string().optional(),
  measurements: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  skinTone: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  onlyfans: z.string().optional(),
})

type PerformerFormData = z.infer<typeof performerSchema>

interface PerformerFormProps {
  performer?: {
    id: string
    name: string
    slug: string
    bio: string | null
    profileImage: string | null
    coverImage: string | null
    nationality: string | null
    birthDate: Date | null
    height: number | null
    measurements: string | null
    hairColor: string | null
    eyeColor: string | null
    skinTone: string | null
    instagram: string | null
    twitter: string | null
    onlyfans: string | null
  }
}

const hairColors = [
  "Rubio", "Castaño", "Negro", "Pelirrojo", "Moreno", "Gris", "Otro"
]

const eyeColors = [
  "Azul", "Verde", "Marrón", "Negro", "Avellana", "Gris", "Otro"
]

const skinTones = [
  "Clara", "Media", "Morena", "Oscura"
]

export function PerformerForm({ performer }: PerformerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [profileImage, setProfileImage] = React.useState<string>(performer?.profileImage || "")
  const [coverImage, setCoverImage] = React.useState<string>(performer?.coverImage || "")
  const [isUploadingProfile, setIsUploadingProfile] = React.useState(false)
  const [isUploadingCover, setIsUploadingCover] = React.useState(false)

  const profileInputRef = React.useRef<HTMLInputElement>(null)
  const coverInputRef = React.useRef<HTMLInputElement>(null)

  const { startUpload: startProfileUpload } = useUploadThing("performerImages", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setProfileImage(res[0].ufsUrl)
        setValue("profileImage", res[0].ufsUrl)
        toast.success("Foto de perfil subida")
      }
      setIsUploadingProfile(false)
    },
    onUploadError: (error) => {
      toast.error(`Error: ${error.message}`)
      setIsUploadingProfile(false)
    },
  })

  const { startUpload: startCoverUpload } = useUploadThing("performerImages", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setCoverImage(res[0].ufsUrl)
        setValue("coverImage", res[0].ufsUrl)
        toast.success("Imagen de portada subida")
      }
      setIsUploadingCover(false)
    },
    onUploadError: (error) => {
      toast.error(`Error: ${error.message}`)
      setIsUploadingCover(false)
    },
  })

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
      nationality: performer?.nationality || "",
      birthDate: performer?.birthDate
        ? new Date(performer.birthDate).toISOString().split("T")[0]
        : "",
      height: performer?.height?.toString() || "",
      measurements: performer?.measurements || "",
      hairColor: performer?.hairColor || "",
      eyeColor: performer?.eyeColor || "",
      skinTone: performer?.skinTone || "",
      instagram: performer?.instagram || "",
      twitter: performer?.twitter || "",
      onlyfans: performer?.onlyfans || "",
    },
  })

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
    setIsUploadingProfile(true)
    await startProfileUpload(Array.from(files))
    if (profileInputRef.current) profileInputRef.current.value = ""
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsUploadingCover(true)
    await startCoverUpload(Array.from(files))
    if (coverInputRef.current) coverInputRef.current.value = ""
  }

  const handleProfileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    setIsUploadingProfile(true)
    await startProfileUpload(Array.from(files))
  }

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    setIsUploadingCover(true)
    await startCoverUpload(Array.from(files))
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

  const onSubmit = async (data: PerformerFormData) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...data,
        profileImage: profileImage || null,
        coverImage: coverImage || null,
        height: data.height ? parseInt(data.height) : null,
        birthDate: data.birthDate || null,
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nacionalidad</Label>
                  <Input
                    id="nationality"
                    {...register("nationality")}
                    placeholder="España"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...register("birthDate")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Physical Attributes */}
          <Card>
            <CardHeader>
              <CardTitle>Atributos Físicos</CardTitle>
              <CardDescription>Características físicas para filtros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    {...register("height")}
                    placeholder="165"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measurements">Medidas</Label>
                  <Input
                    id="measurements"
                    {...register("measurements")}
                    placeholder="90-60-90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hairColor">Color de pelo</Label>
                  <Select
                    defaultValue={performer?.hairColor || ""}
                    onValueChange={(value) => setValue("hairColor", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {hairColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eyeColor">Color de ojos</Label>
                  <Select
                    defaultValue={performer?.eyeColor || ""}
                    onValueChange={(value) => setValue("eyeColor", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {eyeColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skinTone">Tono de piel</Label>
                  <Select
                    defaultValue={performer?.skinTone || ""}
                    onValueChange={(value) => setValue("skinTone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {skinTones.map((tone) => (
                        <SelectItem key={tone} value={tone}>
                          {tone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
              <CardDescription>Perfiles en redes sociales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="flex items-center gap-2">
                  <IconBrandInstagram className="size-5 text-muted-foreground" />
                  <Input
                    id="instagram"
                    {...register("instagram")}
                    placeholder="nombre_usuario"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <div className="flex items-center gap-2">
                  <IconBrandTwitter className="size-5 text-muted-foreground" />
                  <Input
                    id="twitter"
                    {...register("twitter")}
                    placeholder="nombre_usuario"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onlyfans">OnlyFans</Label>
                <div className="flex items-center gap-2">
                  <IconBrandOnlyfans className="size-5 text-muted-foreground" />
                  <Input
                    id="onlyfans"
                    {...register("onlyfans")}
                    placeholder="nombre_usuario"
                  />
                </div>
              </div>
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
