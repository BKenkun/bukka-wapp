"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconChevronDown,
  IconChevronRight,
  IconPalette,
  IconPhoto,
  IconList,
} from "@tabler/icons-react"

interface AttributeValue {
  id: string
  slug: string
  value: string
  colorHex: string | null
  imageUrl: string | null
  order: number
  isActive: boolean
}

interface Attribute {
  id: string
  slug: string
  name: string
  type: "SELECT" | "COLOR" | "IMAGE"
  order: number
  isActive: boolean
  values: AttributeValue[]
  _count?: { products: number }
}

const typeLabels: Record<string, string> = {
  SELECT: "Lista",
  COLOR: "Color",
  IMAGE: "Imagen",
}

const typeIcons: Record<string, React.ReactNode> = {
  SELECT: <IconList className="size-4" />,
  COLOR: <IconPalette className="size-4" />,
  IMAGE: <IconPhoto className="size-4" />,
}

export default function AttributesPage() {
  const [attributes, setAttributes] = React.useState<Attribute[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingAttribute, setEditingAttribute] = React.useState<Attribute | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    type: "SELECT" as "SELECT" | "COLOR" | "IMAGE",
    order: 0,
    isActive: true,
  })
  const [isSaving, setIsSaving] = React.useState(false)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  // Value form state
  const [isValueDialogOpen, setIsValueDialogOpen] = React.useState(false)
  const [editingValue, setEditingValue] = React.useState<AttributeValue | null>(null)
  const [valueFormData, setValueFormData] = React.useState({
    value: "",
    slug: "",
    colorHex: "",
    imageUrl: "",
    order: 0,
    isActive: true,
  })
  const [currentAttributeId, setCurrentAttributeId] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchAttributes()
  }, [])

  async function fetchAttributes() {
    try {
      const res = await fetch("/api/admin/attributes")
      const data = await res.json()
      setAttributes(data.attributes || [])
    } catch {
      toast.error("Error al cargar atributos")
    } finally {
      setIsLoading(false)
    }
  }

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  // Attribute functions
  function openCreateDialog() {
    setEditingAttribute(null)
    setFormData({ name: "", slug: "", type: "SELECT", order: 0, isActive: true })
    setIsDialogOpen(true)
  }

  function openEditDialog(attr: Attribute) {
    setEditingAttribute(attr)
    setFormData({
      name: attr.name,
      slug: attr.slug,
      type: attr.type,
      order: attr.order,
      isActive: attr.isActive,
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingAttribute
        ? `/api/admin/attributes/${editingAttribute.id}`
        : "/api/admin/attributes"
      const method = editingAttribute ? "PATCH" : "POST"

      const slug = formData.slug || generateSlug(formData.name)

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, slug }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingAttribute ? "Atributo actualizado" : "Atributo creado")
      setIsDialogOpen(false)
      fetchAttributes()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este atributo y todos sus valores?")) return

    try {
      const res = await fetch(`/api/admin/attributes/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }
      toast.success("Atributo eliminado")
      fetchAttributes()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar")
    }
  }

  // Value functions
  function openValueCreateDialog(attributeId: string) {
    setCurrentAttributeId(attributeId)
    setEditingValue(null)
    setValueFormData({ value: "", slug: "", colorHex: "", imageUrl: "", order: 0, isActive: true })
    setIsValueDialogOpen(true)
  }

  function openValueEditDialog(attributeId: string, value: AttributeValue) {
    setCurrentAttributeId(attributeId)
    setEditingValue(value)
    setValueFormData({
      value: value.value,
      slug: value.slug,
      colorHex: value.colorHex || "",
      imageUrl: value.imageUrl || "",
      order: value.order,
      isActive: value.isActive,
    })
    setIsValueDialogOpen(true)
  }

  async function handleValueSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentAttributeId) return
    setIsSaving(true)

    try {
      const url = editingValue
        ? `/api/admin/attributes/${currentAttributeId}/values/${editingValue.id}`
        : `/api/admin/attributes/${currentAttributeId}/values`
      const method = editingValue ? "PATCH" : "POST"

      const slug = valueFormData.slug || generateSlug(valueFormData.value)

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...valueFormData,
          slug,
          colorHex: valueFormData.colorHex || null,
          imageUrl: valueFormData.imageUrl || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingValue ? "Valor actualizado" : "Valor creado")
      setIsValueDialogOpen(false)
      fetchAttributes()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleValueDelete(attributeId: string, valueId: string) {
    if (!confirm("¿Eliminar este valor?")) return

    try {
      const res = await fetch(`/api/admin/attributes/${attributeId}/values/${valueId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }
      toast.success("Valor eliminado")
      fetchAttributes()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar")
    }
  }

  const currentAttribute = attributes.find((a) => a.id === currentAttributeId)

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Atributos de Producto</h1>
          <p className="text-muted-foreground">
            Gestiona atributos como Talla, Color, Material para crear variantes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 size-4" />
              Nuevo Atributo
            </Button>
          </DialogTrigger>
          <DialogContent className="text-foreground">
            <DialogHeader>
              <DialogTitle>
                {editingAttribute ? "Editar Atributo" : "Nuevo Atributo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Talla, Color, Material"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Se genera automaticamente"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de visualizacion</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, type: v as "SELECT" | "COLOR" | "IMAGE" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELECT">
                      <div className="flex items-center gap-2">
                        <IconList className="size-4" />
                        Lista desplegable
                      </div>
                    </SelectItem>
                    <SelectItem value="COLOR">
                      <div className="flex items-center gap-2">
                        <IconPalette className="size-4" />
                        Muestras de color
                      </div>
                    </SelectItem>
                    <SelectItem value="IMAGE">
                      <div className="flex items-center gap-2">
                        <IconPhoto className="size-4" />
                        Miniaturas de imagen
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Orden</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <label className="text-sm font-medium">Activo</label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                  {editingAttribute ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Values Dialog */}
      <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
        <DialogContent className="text-foreground">
          <DialogHeader>
            <DialogTitle>
              {editingValue ? "Editar Valor" : "Nuevo Valor"}
              {currentAttribute && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  - {currentAttribute.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleValueSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Valor *</label>
              <Input
                value={valueFormData.value}
                onChange={(e) => setValueFormData({ ...valueFormData, value: e.target.value })}
                placeholder="Ej: S, M, L, Rojo, Azul"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={valueFormData.slug}
                onChange={(e) => setValueFormData({ ...valueFormData, slug: e.target.value })}
                placeholder="Se genera automaticamente"
              />
            </div>
            {currentAttribute?.type === "COLOR" && (
              <div>
                <label className="text-sm font-medium">Color (HEX)</label>
                <div className="flex gap-2">
                  <Input
                    value={valueFormData.colorHex}
                    onChange={(e) => setValueFormData({ ...valueFormData, colorHex: e.target.value })}
                    placeholder="#FF0000"
                  />
                  <input
                    type="color"
                    value={valueFormData.colorHex || "#000000"}
                    onChange={(e) => setValueFormData({ ...valueFormData, colorHex: e.target.value })}
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                </div>
              </div>
            )}
            {currentAttribute?.type === "IMAGE" && (
              <div>
                <label className="text-sm font-medium">URL de Imagen</label>
                <Input
                  value={valueFormData.imageUrl}
                  onChange={(e) => setValueFormData({ ...valueFormData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Orden</label>
              <Input
                type="number"
                value={valueFormData.order}
                onChange={(e) =>
                  setValueFormData({ ...valueFormData, order: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={valueFormData.isActive}
                onCheckedChange={(checked) =>
                  setValueFormData({ ...valueFormData, isActive: checked })
                }
              />
              <label className="text-sm font-medium">Activo</label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsValueDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                {editingValue ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valores</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <IconLoader2 className="size-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : attributes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No hay atributos. Crea el primero (ej: Talla, Color).
                </TableCell>
              </TableRow>
            ) : (
              attributes.map((attr) => (
                <React.Fragment key={attr.id}>
                  <TableRow className="border-b-0">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setExpandedId(expandedId === attr.id ? null : attr.id)}
                      >
                        {expandedId === attr.id ? (
                          <IconChevronDown className="size-4" />
                        ) : (
                          <IconChevronRight className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                      <TableCell>{attr.order}</TableCell>
                      <TableCell className="font-medium">{attr.name}</TableCell>
                      <TableCell className="text-muted-foreground">{attr.slug}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {typeIcons[attr.type]}
                          <span className="text-sm">{typeLabels[attr.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>{attr.values.length}</TableCell>
                      <TableCell>{attr._count?.products || 0}</TableCell>
                      <TableCell>
                        <Badge variant={attr.isActive ? "default" : "secondary"}>
                          {attr.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(attr)}>
                            <IconEdit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(attr.id)}>
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === attr.id && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={9} className="py-4">
                          <div className="ml-6 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">
                                Valores de {attr.name}
                              </h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openValueCreateDialog(attr.id)}
                              >
                                <IconPlus className="mr-1 size-3" />
                                Agregar Valor
                              </Button>
                            </div>
                            {attr.values.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Sin valores. Agrega valores como S, M, L para tallas o Rojo, Azul para
                                colores.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {attr.values.map((val) => (
                                  <div
                                    key={val.id}
                                    className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
                                  >
                                    {attr.type === "COLOR" && val.colorHex && (
                                      <div
                                        className="size-4 rounded-full border"
                                        style={{ backgroundColor: val.colorHex }}
                                      />
                                    )}
                                    {attr.type === "IMAGE" && val.imageUrl && (
                                      <img
                                        src={val.imageUrl}
                                        alt={val.value}
                                        className="size-6 rounded object-cover"
                                      />
                                    )}
                                    <span className="text-sm font-medium">{val.value}</span>
                                    <span className="text-xs text-muted-foreground">({val.slug})</span>
                                    {!val.isActive && (
                                      <Badge variant="secondary" className="text-xs">
                                        Inactivo
                                      </Badge>
                                    )}
                                    <div className="flex gap-1 ml-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6"
                                        onClick={() => openValueEditDialog(attr.id, val)}
                                      >
                                        <IconEdit className="size-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6"
                                        onClick={() => handleValueDelete(attr.id, val.id)}
                                      >
                                        <IconTrash className="size-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
