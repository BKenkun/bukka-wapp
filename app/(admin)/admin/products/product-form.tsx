"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { IconLoader2, IconX, IconAlertTriangle, IconShieldCheck } from "@tabler/icons-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  compareAtPrice: z.string().optional(),
  sku: z.string().optional(),
  stock: z.string().optional(),
  trackInventory: z.boolean(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  riskLevel: z.enum(["LOW_RISK", "HIGH_RISK"]),
  performerId: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

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

interface ProductFormProps {
  product?: {
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    compareAtPrice: number | null
    sku: string | null
    stock: number
    trackInventory: boolean
    images: string[]
    status: string
    riskLevel: string
    performerId: string | null
    categories: { category: Category }[]
  }
  performers: Performer[]
  categories: Category[]
}

export function ProductForm({ product, performers, categories }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    product?.categories.map((pc) => pc.category.id) || []
  )
  const [images, setImages] = React.useState<string[]>(product?.images || [])
  const [newImageUrl, setNewImageUrl] = React.useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      price: product?.price?.toString() || "",
      compareAtPrice: product?.compareAtPrice?.toString() || "",
      sku: product?.sku || "",
      stock: product?.stock?.toString() || "0",
      trackInventory: product?.trackInventory ?? true,
      status: (product?.status as ProductFormData["status"]) || "DRAFT",
      riskLevel: (product?.riskLevel as ProductFormData["riskLevel"]) || "LOW_RISK",
      performerId: product?.performerId || "",
    },
  })

  const watchName = watch("name")
  const watchRiskLevel = watch("riskLevel")
  const watchTrackInventory = watch("trackInventory")

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!product && watchName) {
      const slug = watchName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setValue("slug", slug)
    }
  }, [watchName, setValue, product])

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
        stock: data.stock ? parseInt(data.stock) : 0,
        images,
        categoryIds: selectedCategories,
        performerId: data.performerId || null,
      }

      const url = product
        ? `/api/products/${product.slug}`
        : "/api/products"

      const response = await fetch(url, {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar")
      }

      toast.success(product ? "Producto actualizado" : "Producto creado")
      router.push("/admin/products")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el producto")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const addImage = () => {
    if (newImageUrl && !images.includes(newImageUrl)) {
      setImages([...images, newImageUrl])
      setNewImageUrl("")
    }
  }

  const removeImage = (url: string) => {
    setImages(images.filter((img) => img !== url))
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
              <CardDescription>Nombre, descripción y SKU del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Nombre del producto"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    {...register("sku")}
                    placeholder="ABC-123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/tienda/</span>
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="mi-producto"
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
                  placeholder="Descripción del producto..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Precios</CardTitle>
              <CardDescription>Precio de venta e inventario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <div className="relative">
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...register("price")}
                      placeholder="29.99"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      €
                    </span>
                  </div>
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Precio anterior</Label>
                  <div className="relative">
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      {...register("compareAtPrice")}
                      placeholder="39.99"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      €
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="trackInventory">Control de inventario</Label>
                  <p className="text-xs text-muted-foreground">
                    Seguimiento de stock disponible
                  </p>
                </div>
                <Switch
                  id="trackInventory"
                  checked={watchTrackInventory}
                  onCheckedChange={(checked) => setValue("trackInventory", checked)}
                />
              </div>

              {watchTrackInventory && (
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock disponible</Label>
                  <Input
                    id="stock"
                    type="number"
                    {...register("stock")}
                    placeholder="0"
                    className="w-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Imágenes</CardTitle>
              <CardDescription>Fotos del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <Button type="button" onClick={addImage} variant="secondary">
                  Añadir
                </Button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Imagen ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconX className="size-4" />
                      </button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>Categorías del producto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                    {selectedCategories.includes(category.id) && (
                      <IconX className="ml-1 size-3" />
                    )}
                  </Badge>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay categorías disponibles</p>
                )}
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
                  defaultValue={product?.status || "DRAFT"}
                  onValueChange={(value) => setValue("status", value as ProductFormData["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="ARCHIVED">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Risk Level */}
          <Card>
            <CardHeader>
              <CardTitle>Nivel de Riesgo</CardTitle>
              <CardDescription>Importante para pasarelas de pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                defaultValue={product?.riskLevel || "LOW_RISK"}
                onValueChange={(value) => setValue("riskLevel", value as ProductFormData["riskLevel"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW_RISK">
                    <div className="flex items-center gap-2">
                      <IconShieldCheck className="size-4 text-green-500" />
                      Low Risk
                    </div>
                  </SelectItem>
                  <SelectItem value="HIGH_RISK">
                    <div className="flex items-center gap-2">
                      <IconAlertTriangle className="size-4 text-orange-500" />
                      High Risk
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Alert>
                <AlertDescription className="text-xs">
                  {watchRiskLevel === "HIGH_RISK" ? (
                    <>
                      <strong>High Risk:</strong> Juguetes sexuales, fotos firmadas, coleccionables para adultos.
                      Se procesarán con pasarela high-risk.
                    </>
                  ) : (
                    <>
                      <strong>Low Risk:</strong> Ropa, accesorios, stickers, gorras.
                      Se procesarán con pasarela estándar.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Performer */}
          <Card>
            <CardHeader>
              <CardTitle>Actriz Asociada</CardTitle>
              <CardDescription>Para productos de colección</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                defaultValue={product?.performerId || "none"}
                onValueChange={(value) => setValue("performerId", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {performers.map((performer) => (
                    <SelectItem key={performer.id} value={performer.id}>
                      {performer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              {product ? "Guardar Cambios" : "Crear Producto"}
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
