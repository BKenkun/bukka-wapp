"use client"

import { useState, useEffect } from "react"
import { ShopSectionType } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { IconPlus, IconTrash, IconLink } from "@tabler/icons-react"
import Image from "next/image"

interface ShopSection {
  id: string
  type: ShopSectionType
  title: string | null
  enabled: boolean
  order: number
  config: Record<string, unknown> | null
}

interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

interface ShopSectionEditorProps {
  section: ShopSection
  categories: Category[]
  onSave: (id: string, data: Partial<ShopSection>) => Promise<void>
  onClose: () => void
}

export function ShopSectionEditor({ section, categories, onSave, onClose }: ShopSectionEditorProps) {
  const [title, setTitle] = useState(section.title || "")
  const [config, setConfig] = useState<Record<string, unknown>>(
    (section.config as Record<string, unknown>) || {}
  )
  const [isSaving, setIsSaving] = useState(false)
  const [pages, setPages] = useState<Array<{ id: string; title: string }>>([])

  const [availableVideos, setAvailableVideos] = useState<Array<{ id: string; title: string; thumbnailUrl: string | null }>>([])
  const [performers, setPerformers] = useState<Array<{ id: string; name: string; slug: string; profileImage: string | null }>>([])
  const [products, setProducts] = useState<Array<{ id: string; name: string; slug: string; images: string[]; price: number }>>([])

  useEffect(() => {
    if (section.type === "MODEL_PICKS") {
      fetch("/api/admin/performers/search?limit=50")
        .then(res => res.ok ? res.json() : { performers: [] })
        .then(data => setPerformers(data.performers || []))
        .catch(() => setPerformers([]))
      fetch("/api/admin/products/search?limit=50")
        .then(res => res.ok ? res.json() : { products: [] })
        .then(data => setProducts((data.products || []).map((p: { id: string; name: string; slug: string; images: string[]; price: number | string }) => ({
          ...p, price: Number(p.price),
        }))))
        .catch(() => setProducts([]))
    }
    if (section.type === "PAGE") {
      fetch("/api/admin/pages")
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const allPages = Array.isArray(data) ? data : []
          setPages(allPages.filter((p: { status: string }) => p.status === "PUBLISHED"))
        })
        .catch(() => setPages([]))
    }
    if (section.type === "PRODUCT_VIDEOS") {
      fetch("/api/admin/videos/search?limit=50")
        .then(res => res.ok ? res.json() : { videos: [] })
        .then(data => {
          const vids = data.videos || []
          setAvailableVideos(vids
            .filter((v: { status: string }) => v.status === "PUBLISHED")
            .map((v: { id: string; title: string; thumbnailUrl?: string | null }) => ({
              id: v.id, title: v.title, thumbnailUrl: v.thumbnailUrl || null,
            })))
        })
        .catch(() => setAvailableVideos([]))
    }
  }, [section.type])

  const handleSave = async () => {
    setIsSaving(true)
    await onSave(section.id, {
      title: title || null,
      config,
    })
    setIsSaving(false)
  }

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  // Helper for array items in config
  const getArrayConfig = (key: string): unknown[] => {
    return (config[key] as unknown[]) || []
  }

  const updateArrayItem = (key: string, index: number, field: string, value: unknown) => {
    const items = [...getArrayConfig(key)] as Record<string, unknown>[]
    items[index] = { ...items[index], [field]: value }
    updateConfig(key, items)
  }

  const addArrayItem = (key: string, template: Record<string, unknown>) => {
    const items = [...getArrayConfig(key), template]
    updateConfig(key, items)
  }

  const removeArrayItem = (key: string, index: number) => {
    const items = (getArrayConfig(key) as Record<string, unknown>[]).filter((_, i) => i !== index)
    updateConfig(key, items)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Seccion: {section.type}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titulo de la seccion</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulo que se mostrara en la seccion"
            />
          </div>

          {/* HERO Config */}
          {section.type === "HERO" && (
            <>
              <div className="space-y-2">
                <Label>Imagen de fondo</Label>
                <FileDropzone
                  value={(config.backgroundImage as string) || null}
                  onChange={(url) => updateConfig("backgroundImage", url || "")}
                  accept="image"
                  folder="hero"
                  placeholder="Arrastra una imagen de fondo aqui"
                />
                <p className="text-xs text-muted-foreground">
                  Se usara como fondo si no hay video configurado
                </p>
              </div>
              <div className="space-y-2">
                <Label>Video de fondo (opcional)</Label>
                <FileDropzone
                  value={(config.videoUrl as string) || null}
                  onChange={(url) => updateConfig("videoUrl", url || "")}
                  accept="video"
                  folder="hero"
                  placeholder="Arrastra un video aqui para usarlo como fondo"
                />
                <p className="text-xs text-muted-foreground">
                  Si se sube un video, se mostrara en lugar de la imagen
                </p>
              </div>
              <div className="space-y-2">
                <Label>Texto del badge</Label>
                <Input
                  value={(config.badgeText as string) || ""}
                  onChange={(e) => updateConfig("badgeText", e.target.value)}
                  placeholder="NUEVA COLECCION"
                />
              </div>
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  value={(config.title as string) || ""}
                  onChange={(e) => updateConfig("title", e.target.value)}
                  placeholder="Descubre Nuestra Tienda"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitulo</Label>
                <Textarea
                  value={(config.subtitle as string) || ""}
                  onChange={(e) => updateConfig("subtitle", e.target.value)}
                  placeholder="Encuentra los mejores productos..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Boton primario - Texto</Label>
                  <Input
                    value={(config.ctaPrimaryText as string) || ""}
                    onChange={(e) => updateConfig("ctaPrimaryText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Boton primario - URL</Label>
                  <Input
                    value={(config.ctaPrimaryUrl as string) || ""}
                    onChange={(e) => updateConfig("ctaPrimaryUrl", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Boton secundario - Texto</Label>
                  <Input
                    value={(config.ctaSecondaryText as string) || ""}
                    onChange={(e) => updateConfig("ctaSecondaryText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Boton secundario - URL</Label>
                  <Input
                    value={(config.ctaSecondaryUrl as string) || ""}
                    onChange={(e) => updateConfig("ctaSecondaryUrl", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL del enlace (toda la seccion)</Label>
                <Input
                  value={(config.linkUrl as string) || ""}
                  onChange={(e) => updateConfig("linkUrl", e.target.value)}
                  placeholder="/shop o https://..."
                />
              </div>
            </>
          )}

          {/* TRUST_ICONS Config */}
          {section.type === "TRUST_ICONS" && (
            <>
              {(getArrayConfig("items") as Record<string, unknown>[]).map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Select
                    value={(item.icon as string) || "Shield"}
                    onValueChange={(value) => updateArrayItem("items", index, "icon", value)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Package", "Shield", "Lock", "RotateCcw", "Truck", "ShieldCheck", "Heart", "Star", "Award", "CheckCircle", "Clock", "Gift", "CreditCard", "Headphones", "ThumbsUp", "Zap"].map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={(item.label as string) || ""}
                    onChange={(e) => updateArrayItem("items", index, "label", e.target.value)}
                    placeholder="Etiqueta"
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeArrayItem("items", index)}>
                    <IconTrash className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addArrayItem("items", { icon: "Shield", label: "" })}>
                <IconPlus className="size-4 mr-2" />
                Agregar icono
              </Button>
            </>
          )}

          {/* FEATURED_COLLECTIONS Config */}
          {section.type === "FEATURED_COLLECTIONS" && (
            <>
              <div className="space-y-2">
                <Label>Subtitulo</Label>
                <Input
                  value={(config.subtitle as string) || ""}
                  onChange={(e) => updateConfig("subtitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Categorias destacadas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => {
                    const selectedIds = (config.categoryIds as string[]) || []
                    const isSelected = selectedIds.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => {
                          const ids = isSelected
                            ? selectedIds.filter(id => id !== cat.id)
                            : [...selectedIds, cat.id]
                          updateConfig("categoryIds", ids)
                        }}
                      >
                        {cat.imageUrl && (
                          <div className="relative size-10 rounded overflow-hidden bg-muted flex-shrink-0">
                            <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* PRODUCTS_GRID Config */}
          {section.type === "PRODUCTS_GRID" && (
            <>
              <div className="space-y-2">
                <Label>Ordenar por</Label>
                <Select
                  value={(config.sort as string) || "newest"}
                  onValueChange={(value) => updateConfig("sort", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mas recientes</SelectItem>
                    <SelectItem value="popular">Populares</SelectItem>
                    <SelectItem value="price_asc">Precio ascendente</SelectItem>
                    <SelectItem value="price_desc">Precio descendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad de productos</Label>
                <Select
                  value={String((config.limit as number) || 8)}
                  onValueChange={(value) => updateConfig("limit", Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 8, 12, 16, 20].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} productos</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Columnas</Label>
                <Select
                  value={String((config.columns as number) || 4)}
                  onValueChange={(value) => updateConfig("columns", Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} columnas</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar paginacion</Label>
                  <p className="text-xs text-muted-foreground">Boton de ver todos los productos</p>
                </div>
                <Switch
                  checked={(config.showPagination as boolean) ?? true}
                  onCheckedChange={(checked) => updateConfig("showPagination", checked)}
                />
              </div>
            </>
          )}

          {/* REVIEWS Config */}
          {section.type === "REVIEWS" && (
            <>
              {(getArrayConfig("items") as Record<string, unknown>[]).map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resena {index + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeArrayItem("items", index)}>
                      <IconTrash className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        value={(item.name as string) || ""}
                        onChange={(e) => updateArrayItem("items", index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Puntuacion</Label>
                      <Select
                        value={String((item.rating as number) || 5)}
                        onValueChange={(value) => updateArrayItem("items", index, "rating", Number(value))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(n => (
                            <SelectItem key={n} value={String(n)}>{"★".repeat(n)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Texto</Label>
                    <Textarea
                      value={(item.text as string) || ""}
                      onChange={(e) => updateArrayItem("items", index, "text", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addArrayItem("items", { name: "", rating: 5, text: "" })}>
                <IconPlus className="size-4 mr-2" />
                Agregar resena
              </Button>
            </>
          )}

          {/* FAQ Config */}
          {section.type === "FAQ" && (
            <>
              {(getArrayConfig("items") as Record<string, unknown>[]).map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pregunta {index + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeArrayItem("items", index)}>
                      <IconTrash className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pregunta</Label>
                    <Input
                      value={(item.question as string) || ""}
                      onChange={(e) => updateArrayItem("items", index, "question", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Respuesta</Label>
                    <Textarea
                      value={(item.answer as string) || ""}
                      onChange={(e) => updateArrayItem("items", index, "answer", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addArrayItem("items", { question: "", answer: "" })}>
                <IconPlus className="size-4 mr-2" />
                Agregar pregunta
              </Button>
              <div className="space-y-2 rounded-lg border p-3 bg-muted/30 mt-3">
                <span className="text-xs font-medium text-muted-foreground">Estilos (vacio = color por defecto)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(config.bgColor as string) || "#f9fafb"}
                    onChange={(e) => updateConfig("bgColor", e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border"
                  />
                  <Input
                    value={(config.bgColor as string) || ""}
                    onChange={(e) => updateConfig("bgColor", e.target.value)}
                    placeholder="#hex"
                    className="w-32 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">Fondo</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(config.titleColor as string) || "#000000"}
                    onChange={(e) => updateConfig("titleColor", e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border"
                  />
                  <Input
                    value={(config.titleColor as string) || ""}
                    onChange={(e) => updateConfig("titleColor", e.target.value)}
                    placeholder="#hex"
                    className="w-32 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">Color titulo</span>
                </div>
              </div>
            </>
          )}

          {/* CTA_BANNER Config */}
          {section.type === "CTA_BANNER" && (
            <>
              <div className="space-y-2">
                <Label>Imagen de fondo</Label>
                <FileDropzone
                  value={(config.backgroundImage as string) || null}
                  onChange={(url) => updateConfig("backgroundImage", url || "")}
                  accept="image"
                  folder="cta"
                  placeholder="Arrastra una imagen aqui"
                />
              </div>
              <div className="space-y-2">
                <Label>Video de fondo (opcional)</Label>
                <FileDropzone
                  value={(config.videoUrl as string) || null}
                  onChange={(url) => updateConfig("videoUrl", url || "")}
                  accept="video"
                  folder="cta"
                  placeholder="Arrastra un video aqui"
                />
              </div>
              <div className="space-y-2">
                <Label>Texto del banner</Label>
                <Input
                  value={(config.bannerTitle as string) || ""}
                  onChange={(e) => updateConfig("bannerTitle", e.target.value)}
                  placeholder="Titulo del banner"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea
                  value={(config.bannerDescription as string) || ""}
                  onChange={(e) => updateConfig("bannerDescription", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Texto del boton</Label>
                  <Input
                    value={(config.buttonText as string) || ""}
                    onChange={(e) => updateConfig("buttonText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL del boton</Label>
                  <Input
                    value={(config.buttonUrl as string) || ""}
                    onChange={(e) => updateConfig("buttonUrl", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* VIDEO_GRID Config */}
          {section.type === "VIDEO_GRID" && (
            <>
              <div className="space-y-2">
                <Label>Fuente de videos</Label>
                <Select
                  value={(config.source as string) || "latest"}
                  onValueChange={(value) => updateConfig("source", value)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Ultimos videos</SelectItem>
                    <SelectItem value="popular">Mas populares</SelectItem>
                    <SelectItem value="popular_weekly">Mas vistos de la semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Select
                  value={String((config.limit as number) || 4)}
                  onValueChange={(value) => updateConfig("limit", Number(value))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 4, 6, 8].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} videos</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* MODEL_PICKS Config */}
          {section.type === "MODEL_PICKS" && (
            <>
              <div className="space-y-2">
                <Label>Subtitulo</Label>
                <Input
                  value={(config.subtitle as string) || ""}
                  onChange={(e) => updateConfig("subtitle", e.target.value)}
                  placeholder="See what our top performers are loving"
                />
              </div>
              {(getArrayConfig("items") as Record<string, unknown>[]).map((item, index) => {
                const selectedPerformer = performers.find(p => p.id === (item.performerId as string))
                const selectedProduct = products.find(p => p.id === (item.productId as string))
                return (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pick {index + 1}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeArrayItem("items", index)}>
                        <IconTrash className="size-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Performer</Label>
                      <Select
                        value={(item.performerId as string) || ""}
                        onValueChange={(value) => updateArrayItem("items", index, "performerId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar performer...">
                            {selectedPerformer?.name || "Seleccionar performer..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {performers.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPerformer?.profileImage && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative size-8 rounded-full overflow-hidden">
                            <Image src={selectedPerformer.profileImage} alt="" fill className="object-cover" />
                          </div>
                          <span className="text-xs text-muted-foreground">{selectedPerformer.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Badge</Label>
                        <Input
                          value={(item.badge as string) || ""}
                          onChange={(e) => updateArrayItem("items", index, "badge", e.target.value)}
                          placeholder="Top Performer"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rating</Label>
                        <Select
                          value={String((item.rating as number) || 5)}
                          onValueChange={(value) => updateArrayItem("items", index, "rating", Number(value))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(n => (
                              <SelectItem key={n} value={String(n)}>{"★".repeat(n)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Cita</Label>
                      <Textarea
                        value={(item.quote as string) || ""}
                        onChange={(e) => updateArrayItem("items", index, "quote", e.target.value)}
                        rows={2}
                        placeholder="My favorite accessory..."
                      />
                    </div>

                    <hr />

                    <div className="space-y-1">
                      <Label className="text-xs">Producto recomendado</Label>
                      <Select
                        value={(item.productId as string) || ""}
                        onValueChange={(value) => updateArrayItem("items", index, "productId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto...">
                            {selectedProduct?.name || "Seleccionar producto..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — {p.price}€
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedProduct && (
                        <div className="flex items-center gap-2 mt-1">
                          {selectedProduct.images[0] && (
                            <div className="relative size-10 rounded overflow-hidden">
                              <Image src={selectedProduct.images[0]} alt="" fill className="object-cover" />
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            <p>{selectedProduct.name}</p>
                            <p className="font-medium">{selectedProduct.price}€</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <Button variant="outline" size="sm" onClick={() => addArrayItem("items", {
                performerId: "", productId: "", badge: "Top Performer", quote: "", rating: 5,
              })}>
                <IconPlus className="size-4 mr-2" />
                Agregar pick
              </Button>
            </>
          )}

          {/* PRODUCT_VIDEOS Config */}
          {section.type === "PRODUCT_VIDEOS" && (
            <>
              <div className="space-y-2">
                <Label>Subtitulo</Label>
                <Input
                  value={(config.subtitle as string) || ""}
                  onChange={(e) => updateConfig("subtitle", e.target.value)}
                  placeholder="Watch our products featured in exclusive content"
                />
              </div>
              <div className="space-y-2">
                <Label>Cantidad total de videos</Label>
                <Select
                  value={String((config.limit as number) || 4)}
                  onValueChange={(value) => updateConfig("limit", Number(value))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 6, 8].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} videos</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Los pineados se muestran primero, el resto se rellena con los ultimos videos publicados
                </p>
              </div>
              <div className="space-y-2">
                <Label>Videos pineados</Label>
                <p className="text-xs text-muted-foreground">
                  Selecciona videos para fijar en esta seccion. El resto de slots se rellenan con los mas recientes.
                </p>
                {((config.pinnedVideoIds as string[]) || []).map((videoId, index) => {
                  const video = availableVideos.find(v => v.id === videoId)
                  return (
                    <div key={index} className="flex items-center gap-2 border rounded-lg p-2">
                      <span className="text-sm flex-1 truncate">
                        {video?.title || videoId}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const ids = ((config.pinnedVideoIds as string[]) || []).filter((_, i) => i !== index)
                        updateConfig("pinnedVideoIds", ids)
                      }}>
                        <IconTrash className="size-4 text-destructive" />
                      </Button>
                    </div>
                  )
                })}
                {availableVideos.length > 0 && (
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const current = (config.pinnedVideoIds as string[]) || []
                      if (!current.includes(value)) {
                        updateConfig("pinnedVideoIds", [...current, value])
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pinear un video..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVideos
                        .filter(v => !((config.pinnedVideoIds as string[]) || []).includes(v.id))
                        .map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                )}
                {availableVideos.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay videos publicados disponibles</p>
                )}
              </div>
            </>
          )}

          {/* PAGE Config */}
          {section.type === "PAGE" && (
            <div className="space-y-2">
              <Label>Seleccionar Pagina</Label>
              <Select
                value={(config.pageId as string) || ""}
                onValueChange={(value) => updateConfig("pageId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige una pagina publicada" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay paginas publicadas. Crea una en Paginas CMS primero.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
