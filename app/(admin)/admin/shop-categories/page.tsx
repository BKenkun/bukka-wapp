"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { IconPlus, IconEdit, IconTrash, IconLoader2, IconX, IconPhoto } from "@tabler/icons-react"
import { LocalUploadDropzone } from "@/components/local-upload-button"

interface ShopCategory {
  id: string
  slug: string
  name: string
  description: string | null
  imageUrl: string | null
  order: number
  parentId: string | null
  parent?: { id: string; name: string } | null
  children?: { id: string; name: string; slug: string }[]
  _count?: { products: number }
}

export default function ShopCategoriesPage() {
  const [categories, setCategories] = React.useState<ShopCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<ShopCategory | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    order: 0,
    parentId: "",
  })
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/shop-categories")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      toast.error("Error al cargar categorías")
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingCategory(null)
    setFormData({ name: "", slug: "", description: "", imageUrl: "", order: 0, parentId: "" })
    setIsDialogOpen(true)
  }

  function openEditDialog(cat: ShopCategory) {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      order: cat.order,
      parentId: cat.parentId || "",
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingCategory
        ? `/api/admin/shop-categories/${editingCategory.id}`
        : "/api/admin/shop-categories"
      const method = editingCategory ? "PATCH" : "POST"

      // Auto-generate slug if empty
      const slug =
        formData.slug ||
        formData.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug,
          parentId: formData.parentId || null,
          imageUrl: formData.imageUrl || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingCategory ? "Categoría actualizada" : "Categoría creada")
      setIsDialogOpen(false)
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría? Los productos se quedarán sin esta categoría.")) return

    try {
      const res = await fetch(`/api/admin/shop-categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Categoría eliminada")
      fetchCategories()
    } catch (error) {
      toast.error("Error al eliminar categoría")
    }
  }

  const parentOptions = categories.filter((c) => {
    if (!editingCategory) return true
    if (c.id === editingCategory.id) return false
    if (c.parentId === editingCategory.id) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorías de Tienda</h1>
          <p className="text-muted-foreground">Gestiona las categorías para organizar productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 size-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="text-foreground">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre de la categoría"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Se genera automáticamente"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Imagen de Categoría</label>
                {formData.imageUrl ? (
                  <div className="relative mt-2">
                    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.imageUrl}
                        alt="Imagen de categoría"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                    >
                      <IconX className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <LocalUploadDropzone
                    folder="categories"
                    accept="image/*"
                    onUploadComplete={(result) => {
                      setFormData({ ...formData, imageUrl: result.url })
                      toast.success("Imagen subida correctamente")
                    }}
                    onUploadError={(error) => {
                      toast.error(error.message)
                    }}
                    className="mt-2"
                  >
                    <div className="flex flex-col items-center gap-2 py-6">
                      <IconPhoto className="size-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Arrastra una imagen o haz clic
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recomendado: 800x450px (ratio 16:9)
                      </p>
                    </div>
                  </LocalUploadDropzone>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Categoría Padre</label>
                <Select
                  value={formData.parentId || "__none__"}
                  onValueChange={(v) => setFormData({ ...formData, parentId: v === "__none__" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguna (categoría raíz)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Ninguna (categoría raíz)</SelectItem>
                    {parentOptions.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
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
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                  {editingCategory ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Padre</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <IconLoader2 className="size-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay categorías. Crea la primera.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.order}</TableCell>
                  <TableCell>
                    {cat.imageUrl ? (
                      <div className="relative w-16 h-10 rounded overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-10 rounded bg-muted flex items-center justify-center">
                        <IconPhoto className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.parent?.name || "-"}
                  </TableCell>
                  <TableCell>{cat._count?.products || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(cat)}
                      >
                        <IconEdit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
