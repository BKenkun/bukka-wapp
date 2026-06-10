"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  IconLoader2,
  IconX,
  IconAlertTriangle,
  IconShieldCheck,
  IconPlus,
  IconEdit,
  IconTrash,
  IconWand,
  IconUpload,
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import Image from "next/image"
import { ProductImageGallery } from "@/components/admin/product-image-gallery"
import { PerformerSearch } from "@/components/admin/performer-search"

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z
    .string()
    .min(1, "El slug es requerido")
    .regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
  description: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  compareAtPrice: z.string().optional(),
  sku: z.string().optional(),
  stock: z.string().optional(),
  trackInventory: z.boolean(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  riskLevel: z.enum(["LOW_RISK", "HIGH_RISK"]),
  productType: z.enum(["SIMPLE", "VARIABLE"]),
  weight: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface Performer {
  id: string
  name: string
  slug: string
  profileImage?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface AttributeValue {
  id: string
  value: string
  slug: string
  colorHex: string | null
}

interface Attribute {
  id: string
  name: string
  slug: string
  type: "SELECT" | "COLOR" | "IMAGE"
  values: AttributeValue[]
}

interface Variant {
  id: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  imageUrl: string | null
  weight: number | null
  isActive: boolean
  attributes: {
    attributeId: string
    attributeName: string
    valueId: string
    value: string
    colorHex: string | null
  }[]
}

interface MetadataBlock {
  title: string
  description: string
}

interface ProductMetadata {
  customSectionTitle: string
  blocks: MetadataBlock[]
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
    performers: Performer[]
    productType: string
    weight: number | null
    categories: { category: Category }[]
    tags?: { tag: Tag }[]
    metadata?: Record<string, unknown> | null
  }
  performers: Performer[]
  categories: Category[]
  attributes?: Attribute[]
}

// Variant Image Upload Component
function VariantImageUpload({
  imageUrl,
  onImageChange,
}: {
  imageUrl: string
  onImageChange: (url: string) => void
}) {
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Tipo no válido. Solo JPG, PNG, WebP")
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Imagen demasiado grande. Máximo 4MB")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "products")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        onImageChange(data.url)
        toast.success("Imagen subida")
      } else {
        const error = await res.json()
        toast.error(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Error al subir imagen")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label>Imagen de la variante</Label>
      <div className="flex items-start gap-4">
        {imageUrl ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
            <Image
              src={imageUrl}
              alt="Variante"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => onImageChange("")}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
            >
              <IconX className="size-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Sin imagen</span>
          </div>
        )}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconUpload className="mr-2 size-4" />
            )}
            {isUploading ? "Subiendo..." : "Subir imagen"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Si no tiene imagen, se usará la imagen principal del producto.
          </p>
        </div>
      </div>
    </div>
  )
}

export function ProductForm({
  product,
  performers,
  categories,
  attributes = [],
}: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    product?.categories.map((pc) => pc.category.id) || []
  )
  const [selectedPerformerIds, setSelectedPerformerIds] = React.useState<string[]>(
    product?.performers.map((p) => p.id) || []
  )
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>(
    product?.tags?.map((pt) => pt.tag.id) || []
  )
  const [availableTags, setAvailableTags] = React.useState<Tag[]>([])
  const [images, setImages] = React.useState<string[]>(product?.images || [])

  // Metadata state (per-product custom content)
  const [metadata, setMetadata] = React.useState<ProductMetadata>(() => {
    const saved = product?.metadata as ProductMetadata | null
    return saved || { customSectionTitle: "", blocks: [] }
  })

  // Variants state
  const [variants, setVariants] = React.useState<Variant[]>([])
  const [isLoadingVariants, setIsLoadingVariants] = React.useState(false)
  const [selectedAttributes, setSelectedAttributes] = React.useState<string[]>([])
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [editingVariant, setEditingVariant] = React.useState<Variant | null>(null)
  const [isVariantDialogOpen, setIsVariantDialogOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState(
    product?.productType === "VARIABLE" ? "variants" : "general"
  )
  const [selectedVariantIds, setSelectedVariantIds] = React.useState<string[]>([])
  const [editingStockId, setEditingStockId] = React.useState<string | null>(null)
  const [editingStockValue, setEditingStockValue] = React.useState<number>(0)
  const [variantFormData, setVariantFormData] = React.useState({
    sku: "",
    price: "",
    compareAtPrice: "",
    stock: 0,
    imageUrl: "",
    weight: "",
    isActive: true,
  })

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
      productType: (product?.productType as ProductFormData["productType"]) || "SIMPLE",
      weight: product?.weight?.toString() || "",
    },
  })

  const watchName = watch("name")
  const watchRiskLevel = watch("riskLevel")
  const watchTrackInventory = watch("trackInventory")
  const watchProductType = watch("productType")

  // Load variants when editing a VARIABLE product
  React.useEffect(() => {
    if (product?.id && product.productType === "VARIABLE") {
      fetchVariants()
    }
  }, [product?.id, product?.productType])

  async function fetchVariants() {
    if (!product?.id) return
    setIsLoadingVariants(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}/variants`)
      const data = await res.json()
      setVariants(data.variants || [])
    } catch {
      toast.error("Error al cargar variantes")
    } finally {
      setIsLoadingVariants(false)
    }
  }

  // Cargar tags disponibles
  React.useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch("/api/admin/tags")
        if (res.ok) {
          const data = await res.json()
          setAvailableTags(data.tags || [])
        }
      } catch (error) {
        console.error("Error fetching tags:", error)
      }
    }
    fetchTags()
  }, [])

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
      // Clean metadata: only include if there are blocks
      const cleanMetadata = metadata.blocks.length > 0
        ? metadata
        : null

      const payload = {
        ...data,
        price: parseFloat(data.price),
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
        stock: data.stock ? parseInt(data.stock) : 0,
        weight: data.weight ? parseFloat(data.weight) : null,
        images,
        categoryIds: selectedCategories,
        performerIds: selectedPerformerIds,
        tagIds: selectedTagIds,
        metadata: cleanMetadata,
      }

      const url = product ? `/api/products/${product.slug}` : "/api/products"

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

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  // Variant functions
  const toggleAttributeSelection = (id: string) => {
    setSelectedAttributes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  async function generateVariants() {
    if (!product?.id) {
      toast.error("Guarda el producto primero para generar variantes")
      return
    }
    if (selectedAttributes.length === 0) {
      toast.error("Selecciona al menos un atributo")
      return
    }

    setIsGenerating(true)
    try {
      const basePrice = parseFloat(watch("price")) || 0
      const res = await fetch(`/api/admin/products/${product.id}/variants/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attributeIds: selectedAttributes,
          basePrice,
          baseStock: 0,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(data.message)
      fetchVariants()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar variantes")
    } finally {
      setIsGenerating(false)
    }
  }

  function openEditVariantDialog(variant: Variant) {
    setEditingVariant(variant)
    setVariantFormData({
      sku: variant.sku || "",
      price: variant.price.toString(),
      compareAtPrice: variant.compareAtPrice?.toString() || "",
      stock: variant.stock,
      imageUrl: variant.imageUrl || "",
      weight: variant.weight?.toString() || "",
      isActive: variant.isActive,
    })
    setIsVariantDialogOpen(true)
  }

  async function handleVariantSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingVariant || !product?.id) return

    try {
      const res = await fetch(
        `/api/admin/products/${product.id}/variants/${editingVariant.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: variantFormData.sku || null,
            price: parseFloat(variantFormData.price),
            compareAtPrice: variantFormData.compareAtPrice
              ? parseFloat(variantFormData.compareAtPrice)
              : null,
            stock: variantFormData.stock,
            imageUrl: variantFormData.imageUrl || null,
            weight: variantFormData.weight ? parseFloat(variantFormData.weight) : null,
            isActive: variantFormData.isActive,
          }),
        }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success("Variante actualizada")
      setIsVariantDialogOpen(false)
      fetchVariants()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar")
    }
  }

  async function handleDeleteVariant(variantId: string) {
    if (!product?.id) return
    if (!confirm("¿Eliminar esta variante?")) return

    try {
      const res = await fetch(`/api/admin/products/${product.id}/variants/${variantId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success("Variante eliminada")
      setSelectedVariantIds((prev) => prev.filter((id) => id !== variantId))
      fetchVariants()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar")
    }
  }

  // Bulk selection functions
  function toggleVariantSelection(variantId: string) {
    setSelectedVariantIds((prev) =>
      prev.includes(variantId)
        ? prev.filter((id) => id !== variantId)
        : [...prev, variantId]
    )
  }

  function toggleAllVariants() {
    if (selectedVariantIds.length === variants.length) {
      setSelectedVariantIds([])
    } else {
      setSelectedVariantIds(variants.map((v) => v.id))
    }
  }

  async function handleBulkDelete() {
    if (!product?.id || selectedVariantIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedVariantIds.length} variantes seleccionadas?`)) return

    try {
      const deletePromises = selectedVariantIds.map((id) =>
        fetch(`/api/admin/products/${product.id}/variants/${id}`, { method: "DELETE" })
      )
      await Promise.all(deletePromises)
      toast.success(`${selectedVariantIds.length} variantes eliminadas`)
      setSelectedVariantIds([])
      fetchVariants()
    } catch (error) {
      toast.error("Error al eliminar variantes")
    }
  }

  async function handleBulkStatusChange(isActive: boolean) {
    if (!product?.id || selectedVariantIds.length === 0) return

    try {
      const updatePromises = selectedVariantIds.map((id) =>
        fetch(`/api/admin/products/${product.id}/variants/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        })
      )
      await Promise.all(updatePromises)
      toast.success(`${selectedVariantIds.length} variantes ${isActive ? "activadas" : "desactivadas"}`)
      setSelectedVariantIds([])
      fetchVariants()
    } catch (error) {
      toast.error("Error al actualizar variantes")
    }
  }

  // Inline stock editing
  function startEditingStock(variant: Variant) {
    setEditingStockId(variant.id)
    setEditingStockValue(variant.stock)
  }

  async function saveStock(variantId: string) {
    if (!product?.id) return

    try {
      const res = await fetch(`/api/admin/products/${product.id}/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: editingStockValue }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      setEditingStockId(null)
      fetchVariants()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar stock")
    }
  }

  function handleStockKeyDown(e: React.KeyboardEvent, variantId: string) {
    if (e.key === "Enter") {
      e.preventDefault()
      saveStock(variantId)
    } else if (e.key === "Escape") {
      setEditingStockId(null)
    }
  }

  const getVariantLabel = (variant: Variant) => {
    return variant.attributes.map((a) => a.value).join(" / ")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="variants" disabled={watchProductType !== "VARIABLE"}>
                Variantes {variants.length > 0 && `(${variants.length})`}
              </TabsTrigger>
              <TabsTrigger value="metadata">
                Contenido Extra
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informacion Basica</CardTitle>
                  <CardDescription>Nombre, descripcion y SKU del producto</CardDescription>
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
                      <Input id="sku" {...register("sku")} placeholder="ABC-123" />
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
                    <Label htmlFor="description">Descripcion</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Descripcion del producto..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Precios</CardTitle>
                  <CardDescription>
                    {watchProductType === "VARIABLE"
                      ? "Precio base (las variantes pueden tener precios distintos)"
                      : "Precio de venta e inventario"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">
                        Precio {watchProductType === "VARIABLE" && "base"} *
                      </Label>
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
                          EUR
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
                          EUR
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.001"
                        {...register("weight")}
                        placeholder="0.5"
                      />
                    </div>
                  </div>

                  {watchProductType === "SIMPLE" && (
                    <>
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
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Imagenes del Producto</CardTitle>
                  <CardDescription>
                    Sube fotos del producto. La primera imagen sera la principal.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductImageGallery
                    images={images}
                    onChange={setImages}
                  />
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Categorias</CardTitle>
                  <CardDescription>Categorias del producto</CardDescription>
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
                      <p className="text-sm text-muted-foreground">No hay categorias disponibles</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>Tags del producto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                        {selectedTagIds.includes(tag.id) && (
                          <IconX className="ml-1 size-3" />
                        )}
                      </Badge>
                    ))}
                    {availableTags.length === 0 && (
                      <p className="text-sm text-muted-foreground">No hay tags disponibles</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="variants" className="space-y-6 mt-6">
              {/* Warning for new products */}
              {!product?.id && (
                <Alert className="border-orange-500/50 bg-orange-500/10">
                  <IconAlertTriangle className="size-4 text-orange-500" />
                  <AlertDescription className="text-orange-200">
                    <strong>Paso 1:</strong> Guarda el producto primero haciendo clic en &quot;Crear Producto&quot;.
                    <br />
                    <strong>Paso 2:</strong> Después de guardar, edita el producto para generar las variantes de atributos (talla, color, etc.).
                  </AlertDescription>
                </Alert>
              )}

              {/* Generate Variants */}
              <Card>
                <CardHeader>
                  <CardTitle>Generar Variantes</CardTitle>
                  <CardDescription>
                    Selecciona atributos para generar todas las combinaciones posibles.
                    {!product?.id && " (Disponible después de guardar el producto)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div className={`flex flex-wrap gap-2 ${!product?.id ? "opacity-50 pointer-events-none" : ""}`}>
                    {attributes.map((attr) => (
                      <label
                        key={attr.id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                          selectedAttributes.includes(attr.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Checkbox
                          checked={selectedAttributes.includes(attr.id)}
                          onCheckedChange={() => product?.id && toggleAttributeSelection(attr.id)}
                          disabled={!product?.id}
                        />
                        <span className="font-medium">{attr.name}</span>
                        <span className="text-xs opacity-70">({attr.values.length} valores)</span>
                      </label>
                    ))}
                    {attributes.length === 0 && (
                      <Alert className="border-yellow-500/50 bg-yellow-500/10">
                        <IconAlertTriangle className="size-4 text-yellow-500" />
                        <AlertDescription className="text-yellow-200">
                          <strong>No hay atributos creados.</strong> Para generar variantes, primero debes crear atributos (ej: Talla, Color) en{" "}
                          <a href="/admin/attributes" className="underline font-medium hover:text-yellow-100">
                            Tienda → Atributos
                          </a>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {selectedAttributes.length > 0 && (
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        onClick={generateVariants}
                        disabled={isGenerating || !product?.id}
                      >
                        {isGenerating ? (
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <IconWand className="mr-2 size-4" />
                        )}
                        Generar Variantes
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Se crearan{" "}
                        {selectedAttributes.reduce((acc, id) => {
                          const attr = attributes.find((a) => a.id === id)
                          return acc * (attr?.values.length || 1)
                        }, 1)}{" "}
                        combinaciones
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Variants List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Variantes ({variants.length})</CardTitle>
                      <CardDescription>Edita precio, stock y SKU de cada variante</CardDescription>
                    </div>
                    {selectedVariantIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {selectedVariantIds.length} seleccionadas
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkStatusChange(true)}
                        >
                          Activar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkStatusChange(false)}
                        >
                          Desactivar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                        >
                          <IconTrash className="size-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingVariants ? (
                    <div className="flex justify-center py-8">
                      <IconLoader2 className="size-6 animate-spin" />
                    </div>
                  ) : variants.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay variantes. Usa el generador de arriba para crear combinaciones.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedVariantIds.length === variants.length && variants.length > 0}
                              onCheckedChange={toggleAllVariants}
                            />
                          </TableHead>
                          <TableHead className="w-16">Imagen</TableHead>
                          <TableHead>Variante</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((variant) => (
                          <TableRow key={variant.id} className={selectedVariantIds.includes(variant.id) ? "bg-muted/50" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={selectedVariantIds.includes(variant.id)}
                                onCheckedChange={() => toggleVariantSelection(variant.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                                {variant.imageUrl ? (
                                  <Image
                                    src={variant.imageUrl}
                                    alt={getVariantLabel(variant)}
                                    fill
                                    className="object-cover"
                                  />
                                ) : images[0] ? (
                                  <Image
                                    src={images[0]}
                                    alt={getVariantLabel(variant)}
                                    fill
                                    className="object-cover opacity-50"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                    -
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {variant.attributes.map((attr) => (
                                  <Badge key={attr.valueId} variant="outline">
                                    {attr.colorHex && (
                                      <span
                                        className="size-3 rounded-full mr-1"
                                        style={{ backgroundColor: attr.colorHex }}
                                      />
                                    )}
                                    {attr.value}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {variant.sku || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{Number(variant.price).toFixed(2)}€</TableCell>
                            <TableCell>
                              {editingStockId === variant.id ? (
                                <Input
                                  type="number"
                                  value={editingStockValue}
                                  onChange={(e) => setEditingStockValue(parseInt(e.target.value) || 0)}
                                  onBlur={() => saveStock(variant.id)}
                                  onKeyDown={(e) => handleStockKeyDown(e, variant.id)}
                                  className="w-20 h-8"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditingStock(variant)}
                                  className="text-left hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors"
                                >
                                  {variant.stock}
                                </button>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={variant.isActive ? "default" : "secondary"}>
                                {variant.isActive ? "Activa" : "Inactiva"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditVariantDialog(variant)}
                                >
                                  <IconEdit className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteVariant(variant.id)}
                                >
                                  <IconTrash className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contenido Personalizado</CardTitle>
                  <CardDescription>
                    Agrega bloques de contenido extra para este producto (ej: instrucciones de cuidado, caracteristicas especiales).
                    Se mostrara en la ficha del producto.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Titulo de la seccion</Label>
                    <Input
                      value={metadata.customSectionTitle}
                      onChange={(e) =>
                        setMetadata({ ...metadata, customSectionTitle: e.target.value })
                      }
                      placeholder="Ej: Instrucciones de Cuidado, Caracteristicas, Detalles..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Titulo que aparecera sobre los bloques de contenido
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Bloques de Contenido</Label>
                    {metadata.blocks.map((block, index) => (
                      <div
                        key={index}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Bloque {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newBlocks = [...metadata.blocks]
                              newBlocks.splice(index, 1)
                              setMetadata({ ...metadata, blocks: newBlocks })
                            }}
                          >
                            <IconTrash className="size-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Titulo</Label>
                          <Input
                            value={block.title}
                            onChange={(e) => {
                              const newBlocks = [...metadata.blocks]
                              newBlocks[index] = { ...block, title: e.target.value }
                              setMetadata({ ...metadata, blocks: newBlocks })
                            }}
                            placeholder="Ej: Material, Lavado, Conservacion..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descripcion</Label>
                          <Textarea
                            value={block.description}
                            onChange={(e) => {
                              const newBlocks = [...metadata.blocks]
                              newBlocks[index] = { ...block, description: e.target.value }
                              setMetadata({ ...metadata, blocks: newBlocks })
                            }}
                            placeholder="Describe este aspecto del producto..."
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setMetadata({
                          ...metadata,
                          blocks: [...metadata.blocks, { title: "", description: "" }],
                        })
                      }
                      className="w-full"
                    >
                      <IconPlus className="size-4 mr-2" />
                      Anadir Bloque
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Type */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={watchProductType}
                onValueChange={(value) => {
                  setValue("productType", value as ProductFormData["productType"])
                  // Cambiar automáticamente a la pestaña de variantes cuando se selecciona VARIABLE
                  if (value === "VARIABLE") {
                    setActiveTab("variants")
                  } else {
                    setActiveTab("general")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMPLE">Simple</SelectItem>
                  <SelectItem value="VARIABLE">Variable (con variantes)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {watchProductType === "VARIABLE"
                  ? "Permite tener variantes con diferentes precios y stock (ej: tallas, colores)"
                  : "Producto sin variantes, precio y stock unicos"}
              </p>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Publicacion</CardTitle>
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
                onValueChange={(value) =>
                  setValue("riskLevel", value as ProductFormData["riskLevel"])
                }
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
                      <strong>High Risk:</strong> Juguetes sexuales, fotos firmadas, coleccionables
                      para adultos. Se procesaran con pasarela high-risk.
                    </>
                  ) : (
                    <>
                      <strong>Low Risk:</strong> Ropa, accesorios, stickers, gorras. Se procesaran
                      con pasarela estandar.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Actrices Asociadas</CardTitle>
              <CardDescription>Un producto puede pertenecer a varias actrices</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformerSearch
                performers={performers}
                selectedIds={selectedPerformerIds}
                onChange={setSelectedPerformerIds}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              {product ? "Guardar Cambios" : "Crear Producto"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Variant Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="text-foreground">
          <DialogHeader>
            <DialogTitle>
              Editar Variante{" "}
              {editingVariant && (
                <span className="text-muted-foreground font-normal">
                  - {getVariantLabel(editingVariant)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVariantSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={variantFormData.sku}
                  onChange={(e) => setVariantFormData({ ...variantFormData, sku: e.target.value })}
                  placeholder="ABC-123-M"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={variantFormData.stock}
                  onChange={(e) =>
                    setVariantFormData({ ...variantFormData, stock: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variantFormData.price}
                  onChange={(e) =>
                    setVariantFormData({ ...variantFormData, price: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Precio anterior</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variantFormData.compareAtPrice}
                  onChange={(e) =>
                    setVariantFormData({ ...variantFormData, compareAtPrice: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.001"
                value={variantFormData.weight}
                onChange={(e) =>
                  setVariantFormData({ ...variantFormData, weight: e.target.value })
                }
                className="w-40"
              />
            </div>

            <VariantImageUpload
              imageUrl={variantFormData.imageUrl}
              onImageChange={(url) => setVariantFormData({ ...variantFormData, imageUrl: url })}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={variantFormData.isActive}
                onCheckedChange={(checked) =>
                  setVariantFormData({ ...variantFormData, isActive: checked })
                }
              />
              <Label>Activa</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsVariantDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  )
}
