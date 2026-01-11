"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  IconLoader2,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandOnlyfans,
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

const performerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  bio: z.string().optional(),
  profileImage: z.string().url("URL inválida").or(z.literal("")),
  coverImage: z.string().url("URL inválida").optional().or(z.literal("")),
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

  const onSubmit = async (data: PerformerFormData) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...data,
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

      toast.success(performer ? "Performer actualizada" : "Performer creada")
      router.push("/admin/performers")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar la performer")
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
              <CardDescription>Nombre y perfil de la performer</CardDescription>
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
                      placeholder="nombre-performer"
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
                  placeholder="Descripción de la performer..."
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
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Imágenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileImage">Foto de perfil</Label>
                <Input
                  id="profileImage"
                  {...register("profileImage")}
                  placeholder="https://..."
                />
                {errors.profileImage && (
                  <p className="text-sm text-destructive">{errors.profileImage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Imagen de portada</Label>
                <Input
                  id="coverImage"
                  {...register("coverImage")}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              {performer ? "Guardar Cambios" : "Crear Performer"}
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
