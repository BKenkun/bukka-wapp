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
  performerId: z.string().optional(),
  productType: z.enum(["SIMPLE", "VARIABLE"]),
  weight: z.string().optional(),
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
    productType: string
    weight: number | null
    categories: { category: Category }[]
  }
  performers: Performer[]
  categories: Category[]
  attributes?: Attribute[]
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
  const [images, setImages] = React.useState<string[]>(product?.images || [])
  const [newImageUrl, setNewImageUrl] = React.useState("")

  // Variants state
  const [variants, setVariants] = React.useState<Variant[]>([])
  const [isLoadingVariants, setIsLoadingVariants] = React.useState(false)
  const [selectedAttributes, setSelectedAttributes] = React.useState<string[]>([])
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [editingVariant, setEditingVariant] = React.useState<Variant | null>(null)
  const [isVariantDialogOpen, setIsVariantDialogOpen] = React.useState(false)
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
      performerId: product?.performerId || "",
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
        weight: data.weight ? parseFloat(data.weight) : null,
        images,
        categoryIds: selectedCategories,
        performerId: data.performerId || null,
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

  const addImage = () => {
    if (newImageUrl && !images.includes(newImageUrl)) {
      setImages([...images, newImageUrl])
      setNewImageUrl("")
    }
  }

  const removeImage = (url: string) => {
    setImages(images.filter((img) => img !== url))
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
      fetchVariants()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar")
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
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="variants" disabled={watchProductType !== "VARIABLE"}>
                Variantes {variants.length > 0 && `(${variants.length})`}
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
                  <CardTitle>Imagenes</CardTitle>
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
                      Anadir
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
                            <Badge className="absolute bottom-1 left-1 text-xs">Principal</Badge>
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
            </TabsContent>

            <TabsContent value="variants" className="space-y-6 mt-6">
              {/* Generate Variants */}
              <Card>
                <CardHeader>
                  <CardTitle>Generar Variantes</CardTitle>
                  <CardDescription>
                    Selecciona atributos para generar todas las combinaciones posibles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!product?.id && (
                    <Alert>
                      <AlertDescription>
                        Guarda el producto primero para poder generar variantes.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {attributes.map((attr) => (
                      <div
                        key={attr.id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                          selectedAttributes.includes(attr.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleAttributeSelection(attr.id)}
                      >
                        <Checkbox
                          checked={selectedAttributes.includes(attr.id)}
                          onCheckedChange={() => toggleAttributeSelection(attr.id)}
                        />
                        <span className="font-medium">{attr.name}</span>
                        <span className="text-xs opacity-70">({attr.values.length} valores)</span>
                      </div>
                    ))}
                    {attributes.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No hay atributos disponibles. Crea atributos en{" "}
                        <a href="/admin/attributes" className="underline">
                          Tienda &gt; Atributos
                        </a>
                      </p>
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
                  <CardTitle>Variantes ({variants.length})</CardTitle>
                  <CardDescription>Edita precio, stock y SKU de cada variante</CardDescription>
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
                          <TableRow key={variant.id}>
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
                            <TableCell className="text-muted-foreground">
                              {variant.sku || "-"}
                            </TableCell>
                            <TableCell>{Number(variant.price).toFixed(2)} EUR</TableCell>
                            <TableCell>{variant.stock}</TableCell>
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
                onValueChange={(value) =>
                  setValue("productType", value as ProductFormData["productType"])
                }
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

          {/* Performer */}
          <Card>
            <CardHeader>
              <CardTitle>Actriz Asociada</CardTitle>
              <CardDescription>Para productos de coleccion</CardDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={variantFormData.weight}
                  onChange={(e) =>
                    setVariantFormData({ ...variantFormData, weight: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>URL de imagen</Label>
                <Input
                  value={variantFormData.imageUrl}
                  onChange={(e) =>
                    setVariantFormData({ ...variantFormData, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
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
